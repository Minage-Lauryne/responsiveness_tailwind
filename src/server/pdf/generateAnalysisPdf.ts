import { jsPDF } from "jspdf";
import { db } from "@/server/db";
import { ChatType } from "@prisma/client";
import fs from "fs";
import path from "path";
import "@/fonts/Montserrat-Regular";
import "@/fonts/Montserrat-Medium";
import "@/fonts/Montserrat-Bold";

interface MessagePart {
  text?: string;
  content?: string;
}

interface AssistantMessage {
  id: string;
  parts?: string | MessagePart | (string | MessagePart)[];
  createdAt: Date;
  role: "assistant";
}

interface Chat {
  id: string;
  SubjectId: string;
  type: ChatType;
  updatedAt: Date;
}

interface Subject {
  id: string;
  title?: string | null;
}

function getLogoBase64(): string | null {
  try {
    const logoPath = path.join(process.cwd(), "public", "logo", "logo-secondary.png");
    const imageBuffer = fs.readFileSync(logoPath);
    return `data:image/png;base64,${imageBuffer.toString("base64")}`;
  } catch (err) {
    console.warn("Logo image not found:", err);
    return null;
  }
}

function extractTextFromParts(parts: string | MessagePart | (string | MessagePart)[] | undefined): string {
  if (!parts) return "";

  if (typeof parts === "string") return parts;

  if (Array.isArray(parts)) {
    return parts
      .map((part) =>
        typeof part === "string" ? part : part?.text ?? part?.content ?? ""
      )
      .filter(Boolean)
      .join("\n\n")
      .trim();
  }

  if (typeof parts === "object") {
    return parts.text ?? parts.content ?? "";
  }

  return String(parts);
}

async function getLatestAssistantMessageText(
  subjectId: string,
  chatType: ChatType,
  assistantIndex = 0
): Promise<string> {
  const chat = await db.chat.findFirst({
    where: { SubjectId: subjectId, type: chatType },
    orderBy: { updatedAt: "desc" },
  });

  if (!chat) return "No analysis available";

  const messages = await db.message.findMany({
    where: { chatId: chat.id, role: "assistant" },
    orderBy: { createdAt: "desc" },
    take: assistantIndex + 1,
  });

  const message = messages[assistantIndex] as AssistantMessage | undefined;
  if (!message) return "No analysis available";

  return extractTextFromParts(message.parts);
}

function addHeader(pdf: jsPDF): number {
  const pageWidth = pdf.internal.pageSize.getWidth();
  pdf.setFillColor(240, 248, 255);
  pdf.rect(0, 0, pageWidth, 60, "F");

  const logoBase64 = getLogoBase64();
  if (logoBase64) {
    try {
      pdf.addImage(logoBase64, "PNG", (pageWidth - 25) / 2, 8, 25, 25);
    } catch (err) {
      console.warn("Failed to embed logo:", err);
    }
  }

  pdf.setFont("Montserrat-Bold");
  pdf.setFontSize(20);
  pdf.setTextColor(0, 102, 204);
  pdf.text("Complere", pageWidth / 2, 40, { align: "center" });

  pdf.setFont("Montserrat-Regular");
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text("Intelligent Analysis Platform", pageWidth / 2, 47, { align: "center" });

  pdf.setFont("Montserrat-Bold");
  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
  pdf.text("Analysis Report", 20, 65);

  pdf.setFontSize(10);
  pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 20, 75, { align: "right" });

  return 90;
}

function filterOutFundingRecommendations(content: string): string {
  // Remove "Funding Recommendations" section and similar variations
  const patterns = [
    /## Funding Recommendations[\s\S]*?(?=##|$)/gi,
    /### Funding Recommendations[\s\S]*?(?=###|##|$)/gi,
    /# Funding Recommendations[\s\S]*?(?=#|$)/gi,
    /## Recommendations for Funders[\s\S]*?(?=##|$)/gi,
    /### Recommendations for Funders[\s\S]*?(?=###|##|$)/gi,
    /# Recommendations for Funders[\s\S]*?(?=#|$)/gi,
  ];
  
  let filteredContent = content;
  patterns.forEach(pattern => {
    filteredContent = filteredContent.replace(pattern, '');
  });
  
  return filteredContent.trim();
}

function extractCitations(content: string): { citations: string[]; cleanedContent: string } {
  const citations: string[] = [];
  
  // Extract complete citation blocks with descriptions, relevance, and links
  // Split content into lines for better processing
  const lines = content.split('\n');
  const cleanedLines: string[] = [];
  let currentCitation = '';
  let inCitation = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim() ?? '';
    
    // Check if this line starts a new numbered citation
    const citationStart = line.match(/^(\d+\.\s+[A-Z])/);
    
    if (citationStart) {
      // If we were building a previous citation, save it
      if (inCitation && currentCitation.length > 50) {
        citations.push(currentCitation.trim());
      }
      
      // Start new citation - don't add to cleaned content
      currentCitation = line;
      inCitation = true;
    } else if (inCitation) {
      // Check if we've hit a section break or new content
      const prevLine = i > 0 ? lines[i-1]?.trim() ?? '' : '';
      if (line.match(/^(##|###|#\s)/) || 
          (line.length > 0 && i > 0 && prevLine === '' && !line.match(/^(This|Relevance:|Citation:|Link:|DOI:|PMID:|arXiv:)/i))) {
        // End current citation and save it
        if (currentCitation.length > 50) {
          citations.push(currentCitation.trim());
        }
        inCitation = false;
        currentCitation = '';
        // This line is not part of citation, add to cleaned content
        cleanedLines.push(lines[i] ?? '');
      } else if (line.length > 0) {
        // Continue building current citation - don't add to cleaned content
        currentCitation += '\n' + line;
      } else {
        // Empty line within citation - don't add to cleaned content
      }
    } else {
      // Not in citation, add to cleaned content
      cleanedLines.push(lines[i] ?? '');
    }
  }
  
  // Don't forget the last citation if we were building one
  if (inCitation && currentCitation.length > 50) {
    citations.push(currentCitation.trim());
  }
  
  // Clean up the content by removing excessive blank lines
  const cleanedContent = cleanedLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  
  // If no full citation blocks found, fall back to extracting individual citation elements
  // but still remove them from the content
  if (citations.length === 0) {
    let workingContent = content;
    const patterns = [
      // Parenthetical citations (Author, Year) or (Author et al., Year)
      /\([^)]*(?:[A-Z][a-z]+(?:\s+(?:et\s+al\.|\&\s+[A-Z][a-z]+))?[,\s]*\d{4}[^)]*)\)/g,
      
      // Square bracket citations [1], [Author, Year], etc.
      /\[[^\]]*(?:\d+|[A-Z][a-z]+[^,]*,?\s*\d{4})[^\]]*\]/g,
      
      // DOI patterns
      /(?:doi:|DOI:?\s*|https?:\/\/(?:www\.)?doi\.org\/)(10\.\d{4,}\/[^\s,\)]+)/gi,
      
      // Direct URL citations
      /https?:\/\/[^\s\),\]]+(?:\.[^\s\),\]]+)*/g,
      
      // Author-year patterns in text (not parenthetical)
      /(?<=^|\s)([A-Z][a-z]+(?:\s+(?:et\s+al\.|\&\s+[A-Z][a-z]+))?,?\s+\d{4})(?=\s|[.,;]|$)/g,
      
      // Multiple authors in parentheses
      /\([^)]*[A-Z][a-z]+[^)]*\d{4}[^)]*\)/g,
      
      // PubMed IDs
      /(?:PMID:?\s*)(\d{7,8})/gi,
      
      // arXiv IDs
      /(?:arXiv:?\s*)(\d{4}\.\d{4,5})/gi
    ];
    
    // Process each pattern and remove from content
    patterns.forEach(pattern => {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      
      while ((match = regex.exec(workingContent)) !== null) {
        const citation = match[0].trim();
        
        // Skip if too short or already exists
        if (citation.length < 4 || citations.includes(citation)) {
          continue;
        }
        
        // Clean up obvious false positives
        if (citation.match(/^(http|www)/i) && !citation.includes('doi')) {
          // For URLs, keep only if they look like academic sources
          if (citation.match(/(?:ncbi|pubmed|arxiv|scholar|academia|researchgate|doi)/i)) {
            citations.push(citation);
            // Remove from content
            workingContent = workingContent.replace(citation, '');
          }
        } else {
          // For other citation formats, add them and remove from content
          citations.push(citation);
          workingContent = workingContent.replace(citation, '');
        }
      }
    });
    
    // Use the cleaned content
    return {
      citations: Array.from(new Set(citations)),
      cleanedContent: workingContent.replace(/\s{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
    };
  }
  
  // Remove exact duplicates
  const uniqueCitations = Array.from(new Set(citations));
  
  return {
    citations: uniqueCitations,
    cleanedContent: cleanedContent
  };
}

function removeCitationSections(content: string): string {
  // Remove existing citation/bibliography sections
  const patterns = [
    /## Citations[\s\S]*?(?=##|$)/gi,
    /### Citations[\s\S]*?(?=###|##|$)/gi,
    /# Citations[\s\S]*?(?=#|$)/gi,
    /## Bibliography[\s\S]*?(?=##|$)/gi,
    /### Bibliography[\s\S]*?(?=###|##|$)/gi,
    /# Bibliography[\s\S]*?(?=#|$)/gi,
    /## References[\s\S]*?(?=##|$)/gi,
    /### References[\s\S]*?(?=###|##|$)/gi,
    /# References[\s\S]*?(?=#|$)/gi,
  ];
  
  let cleanContent = content;
  patterns.forEach(pattern => {
    cleanContent = cleanContent.replace(pattern, '');
  });
  
  return cleanContent.trim();
}

function addSection(
  pdf: jsPDF,
  title: string,
  content: string,
  currentY: number,
  pageHeight: number
): number {
  if (currentY > pageHeight - 60) {
    pdf.addPage();
    currentY = 30;
  }

  pdf.setFont("Montserrat-Bold");
  pdf.setFontSize(15);
  pdf.setTextColor(0, 102, 204);
  pdf.text(title, 20, currentY);
  pdf.setDrawColor(0, 102, 204);
  pdf.setLineWidth(0.6);
  pdf.line(20, currentY + 3, 190, currentY + 3);
  currentY += 20;

  pdf.setFont("Montserrat-Regular");
  pdf.setFontSize(11);
  pdf.setTextColor(40, 40, 40);

  const formattedContent = (content || "")
    // Handle markdown headers
    .replace(/^# (.*)$/gm, (_, t: string) => `\n[h1]${t}\n`)
    .replace(/^## (.*)$/gm, (_, t: string) => `\n[h2]${t}\n`)
    .replace(/^### (.*)$/gm, (_, t: string) => `\n[h3]${t}\n`)
    .replace(/^#### (.*)$/gm, (_, t: string) => `\n[h4]${t}\n`)
    // Handle bold text with custom markers (prioritize ** over single *)
    .replace(/\*\*(.*?)\*\*/g, '[bold]$1[/bold]')
    .replace(/__(.*?)__/g, '[bold]$1[/bold]')
    // Handle italic text (only single * or _ that aren't part of **)
    .replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '[italic]$1[/italic]')
    .replace(/(?<!_)_([^_]+?)_(?!_)/g, '[italic]$1[/italic]')
    // Handle code/monospace text
    .replace(/`([^`]+)`/g, '[code]$1[/code]')
    // Handle strikethrough (convert to italic for PDF)
    .replace(/~~(.*?)~~/g, '[italic]$1[/italic]')
    // Clean up excessive newlines
    .replace(/\n{2,}/g, "\n")
    .trim();

  const paragraphs: string[] = formattedContent.split(/\n/).filter(Boolean);
  const lineHeight = 5.5;

  // Function to render text with formatting
  const renderFormattedText = (text: string, x: number, y: number, maxWidth: number): number => {
    let currentY = y;
    const originalFontSize = 10.5; // Store the original font size
    
    // Split text by formatting markers while preserving them
    const parts = text.split(/(\[(?:bold|italic|code|\/bold|\/italic|\/code)\])/);
    let currentText = '';
    let isBold = false;
    let isItalic = false;
    
    for (const part of parts) {
      if (part === '[bold]') {
        // Render current text if any, then switch to bold
        if (currentText) {
          const lines = pdf.splitTextToSize(currentText, maxWidth) as string[];
          pdf.text(lines, x, currentY);
          currentY += lines.length * lineHeight;
          currentText = '';
        }
        isBold = true;
        pdf.setFont(isItalic ? "Montserrat-Bold" : "Montserrat-Bold");
        pdf.setFontSize(originalFontSize); // Maintain consistent font size
      } else if (part === '[/bold]') {
        // Render current bold text, then switch back
        if (currentText) {
          const lines = pdf.splitTextToSize(currentText, maxWidth) as string[];
          pdf.text(lines, x, currentY);
          currentY += lines.length * lineHeight;
          currentText = '';
        }
        isBold = false;
        pdf.setFont(isItalic ? "Montserrat-Medium" : "Montserrat-Regular");
        pdf.setFontSize(originalFontSize); // Maintain consistent font size
      } else if (part === '[italic]') {
        // Render current text, then switch to italic (use Medium as italic substitute)
        if (currentText) {
          const lines = pdf.splitTextToSize(currentText, maxWidth) as string[];
          pdf.text(lines, x, currentY);
          currentY += lines.length * lineHeight;
          currentText = '';
        }
        isItalic = true;
        pdf.setFont(isBold ? "Montserrat-Bold" : "Montserrat-Medium");
        pdf.setFontSize(originalFontSize); // Maintain consistent font size
      } else if (part === '[/italic]') {
        // Render current italic text, then switch back
        if (currentText) {
          const lines = pdf.splitTextToSize(currentText, maxWidth) as string[];
          pdf.text(lines, x, currentY);
          currentY += lines.length * lineHeight;
          currentText = '';
        }
        isItalic = false;
        pdf.setFont(isBold ? "Montserrat-Bold" : "Montserrat-Regular");
        pdf.setFontSize(originalFontSize); // Maintain consistent font size
      } else if (part === '[code]') {
        // Render current text, then switch to code (use bold for emphasis with smaller size)
        if (currentText) {
          const lines = pdf.splitTextToSize(currentText, maxWidth) as string[];
          pdf.text(lines, x, currentY);
          currentY += lines.length * lineHeight;
          currentText = '';
        }
        pdf.setFont("Montserrat-Bold");
        pdf.setFontSize(9.5); // Slightly smaller for code
      } else if (part === '[/code]') {
        // Render current code text, then switch back
        if (currentText) {
          const lines = pdf.splitTextToSize(currentText, maxWidth) as string[];
          pdf.text(lines, x, currentY);
          currentY += lines.length * lineHeight;
          currentText = '';
        }
        // Restore original font size and proper font weight
        pdf.setFontSize(originalFontSize);
        pdf.setFont(isBold ? (isItalic ? "Montserrat-Bold" : "Montserrat-Bold") : (isItalic ? "Montserrat-Medium" : "Montserrat-Regular"));
      } else if (!part.match(/^\[.*\]$/)) {
        // Regular text part
        currentText += part;
      }
    }
    
    // Render any remaining text
    if (currentText) {
      const lines = pdf.splitTextToSize(currentText, maxWidth) as string[];
      pdf.text(lines, x, currentY);
      currentY += lines.length * lineHeight;
    }
    
    return currentY;
  };

  for (const p of paragraphs) {
    if (currentY > pageHeight - 40) {
      pdf.addPage();
      currentY = 30;
    }

    if (p.startsWith("[h1]")) {
      pdf.setFont("Montserrat-Bold");
      pdf.setFontSize(14.5);
      pdf.setTextColor(30, 30, 30);
      const headerText = p.replace("[h1]", "").trim();
      // Headers are typically bold already, but process any other formatting
      const cleanHeaderText = headerText.replace(/\[bold\]|\[\/bold\]/g, '').replace(/\[italic\]|\[\/italic\]/g, '').replace(/\[code\]|\[\/code\]/g, '');
      pdf.text(cleanHeaderText, 25, currentY);
      currentY += 9;
    } else if (p.startsWith("[h2]")) {
      pdf.setFont("Montserrat-Bold");
      pdf.setFontSize(13.5);
      pdf.setTextColor(30, 30, 30);
      const headerText = p.replace("[h2]", "").trim();
      const cleanHeaderText = headerText.replace(/\[bold\]|\[\/bold\]/g, '').replace(/\[italic\]|\[\/italic\]/g, '').replace(/\[code\]|\[\/code\]/g, '');
      pdf.text(cleanHeaderText, 25, currentY);
      currentY += 8;
    } else if (p.startsWith("[h3]")) {
      pdf.setFont("Montserrat-Bold");
      pdf.setFontSize(12.5);
      pdf.setTextColor(30, 30, 30);
      const headerText = p.replace("[h3]", "").trim();
      const cleanHeaderText = headerText.replace(/\[bold\]|\[\/bold\]/g, '').replace(/\[italic\]|\[\/italic\]/g, '').replace(/\[code\]|\[\/code\]/g, '');
      pdf.text(cleanHeaderText, 25, currentY);
      currentY += 8;
    } else if (p.startsWith("[h4]")) {
      pdf.setFont("Montserrat-Bold");
      pdf.setFontSize(11.5);
      pdf.setTextColor(30, 30, 30);
      const headerText = p.replace("[h4]", "").trim();
      const cleanHeaderText = headerText.replace(/\[bold\]|\[\/bold\]/g, '').replace(/\[italic\]|\[\/italic\]/g, '').replace(/\[code\]|\[\/code\]/g, '');
      pdf.text(cleanHeaderText, 25, currentY);
      currentY += 7;
    } else if (/^\d+\.\s/.test(p)) {
      pdf.setFont("Montserrat-Regular");
      pdf.setFontSize(10.5);
      pdf.setTextColor(40, 40, 40);
      
      // Use formatted text rendering if the paragraph contains formatting markers
      if (p.includes('[bold]') || p.includes('[italic]') || p.includes('[code]')) {
        currentY = renderFormattedText(p, 30, currentY, 165);
      } else {
        const lines = pdf.splitTextToSize(p, 165);
        pdf.text(lines, 30, currentY);
        currentY += lines.length * lineHeight;
      }
    } else if (/^(•|-|\*)\s/.test(p)) {
      pdf.setFont("Montserrat-Regular");
      pdf.setFontSize(10.5);
      pdf.setTextColor(40, 40, 40);
      const clean = p.replace(/^(•|-|\*)\s*/, "• ");
      
      // Use formatted text rendering if the paragraph contains formatting markers
      if (clean.includes('[bold]') || clean.includes('[italic]') || clean.includes('[code]')) {
        currentY = renderFormattedText(clean, 30, currentY, 165);
      } else {
        const lines = pdf.splitTextToSize(clean, 165);
        pdf.text(lines, 30, currentY);
        currentY += lines.length * lineHeight;
      }
    } else {
      pdf.setFont("Montserrat-Regular");
      pdf.setFontSize(10.5);
      pdf.setTextColor(40, 40, 40);
      
      // Use formatted text rendering if the paragraph contains formatting markers
      if (p.includes('[bold]') || p.includes('[italic]') || p.includes('[code]')) {
        currentY = renderFormattedText(p, 25, currentY, 170);
        currentY += 3;
      } else {
        const lines = pdf.splitTextToSize(p, 170);
        pdf.text(lines, 25, currentY);
        currentY += lines.length * lineHeight + 3;
      }
    }
  }

  return currentY + 15;
}

function addFooter(pdf: jsPDF, pageNumber: number): void {
  const pageHeight = pdf.internal.pageSize.getHeight();
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.5);
  pdf.line(20, pageHeight - 15, 190, pageHeight - 15);

  pdf.setFont("Montserrat-Regular");
  pdf.setFontSize(9);
  pdf.setTextColor(150, 150, 150);
  pdf.text("© 2025 Complere. All rights reserved.", 105, pageHeight - 10, { align: "center" });
  pdf.text(`Page ${pageNumber}`, 190, pageHeight - 10, { align: "right" });
}

export async function generateAnalysisPdf(subjectId: string, _analysisType: string): Promise<{
  buffer: Buffer;
  fileName: string;
  subjectTitle: string;
}> {
  const subject = await db.subject.findUnique({ where: { id: subjectId } });
  if (!subject) throw new Error("Subject not found");

  const initialAnalysisText = await getLatestAssistantMessageText(subjectId, ChatType.ANALYSIS, 0);
  const gatherPerspectiveText = await getLatestAssistantMessageText(subjectId, ChatType.ANALYSIS, 1);
  const landscapeAnalysisText = await getLatestAssistantMessageText(subjectId, ChatType.LANDSCAPE_ANALYSIS, 0);

  const firstLineRaw = initialAnalysisText?.split("\n")[0] ?? "";
  const firstLine = String(firstLineRaw).trim();
  const fromSubject = String(subject.title ?? "").trim();

  let cleanTitle = firstLine || fromSubject || "Untitled Analysis";

  cleanTitle = cleanTitle.replace(/^#+\s*/, "").trim();
  cleanTitle = cleanTitle.replace(/^[\s\-_]+/, "").trim();

  const fileSafeBase = cleanTitle.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, " ").trim();

  const fileName = fileSafeBase
    ? `${fileSafeBase.replace(/ /g, "_")}_Report.pdf`
    : "Untitled_Analysis_Report.pdf";

  const pdf = new jsPDF();
  const pageHeight = pdf.internal.pageSize.getHeight();

  let currentY = addHeader(pdf);

  // Extract citations and get cleaned content (citations moved, not copied)
  const initialResult = extractCitations(initialAnalysisText || "");
  const perspectiveResult = extractCitations(gatherPerspectiveText || "");
  const landscapeResult = extractCitations(landscapeAnalysisText || "");

  // Combine all citations and remove duplicates
  const allCitations = [
    ...initialResult.citations,
    ...perspectiveResult.citations,
    ...landscapeResult.citations
  ].filter((citation, index, self) => self.indexOf(citation) === index);

  // Use the cleaned content (with citations removed) and apply additional filtering
  const filteredInitialAnalysis = removeCitationSections(filterOutFundingRecommendations(initialResult.cleanedContent));
  const filteredGatherPerspective = removeCitationSections(filterOutFundingRecommendations(perspectiveResult.cleanedContent));
  const filteredLandscapeAnalysis = removeCitationSections(filterOutFundingRecommendations(landscapeResult.cleanedContent));

  // Helper function to check if content is meaningful
  const hasContent = (content: string): boolean => {
    if (!content) return false;
    
    // Remove common empty content patterns
    const cleaned = content
      .trim()
      .replace(/^(No analysis available|No data|N\/A|TBD|Coming soon|To be determined)$/gi, '')
      .replace(/^\s*#{1,6}\s*$/gm, '') // Empty headers
      .replace(/^\s*[-*+]\s*$/gm, '') // Empty bullet points
      .replace(/^\s*\d+\.\s*$/gm, '') // Empty numbered lists
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    return cleaned.length > 10; // At least 10 meaningful characters
  };

  // Only add sections that have meaningful content
  if (hasContent(filteredInitialAnalysis)) {
    currentY = addSection(pdf, "Initial Analysis", filteredInitialAnalysis, currentY, pageHeight);
  }
  
  if (hasContent(filteredGatherPerspective)) {
    currentY = addSection(pdf, "Gather Additional Perspective", filteredGatherPerspective, currentY, pageHeight);
  }
  
  if (hasContent(filteredLandscapeAnalysis)) {
    currentY = addSection(pdf, "Landscape Analysis", filteredLandscapeAnalysis, currentY, pageHeight);
  }

  // Add citations section if there are citations
  if (allCitations.length > 0) {
    const citationsContent = allCitations.map((citation, index) => {
      // Renumber all citations sequentially, removing original numbering
      const cleanCitation = citation.replace(/^\d+\.\s*/, ''); // Remove existing number
      return `${index + 1}. ${cleanCitation}`;
    }).join('\n\n');
    
    // Only add citations section if the content is meaningful
    if (citationsContent.trim().length > 0) {
      addSection(pdf, "Citations", citationsContent, currentY, pageHeight);
    }
  }

  const totalPages = (pdf.internal as { pages: unknown[] }).pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    addFooter(pdf, i);
  }

  const buffer = Buffer.from(pdf.output("arraybuffer"));
  return { buffer, fileName, subjectTitle: cleanTitle };
}
