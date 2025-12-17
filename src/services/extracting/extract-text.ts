import db from "@/server/db";
import { WorkspaceDocument } from "@prisma/client";
import { getDocumentProxy, extractText as unpdfExtractText } from "unpdf";
import { getDocument } from "../supabase";
import { extractTextFromWord } from "./from-word";

const AVERAGE_WORDS_PER_PAGE = 275;

const SupportedFileTypes = {
  DOCX: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  TXT: "text/plain",
  PDF: "application/pdf",
} as const;

export async function extractText(document: WorkspaceDocument) {
  if (!document.supabaseURL) {
    throw new Error("No supabase URL found");
  }
  const fileBlob = await getDocument(document.supabaseURL);

  const { pageCount, rawText } = await getTextFromFile(
    fileBlob,
    document.fileType,
  );

  const cleanedRawText = rawText.replace(/\x00/g, ""); // Remove null bytes

  const rawTextWordCount = cleanedRawText
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  await db.workspaceDocument.update({
    where: { id: document.id },
    data: {
      pageCount,
      rawTextWordCount,
      rawText: cleanedRawText,
    },
  });

  console.log(
    `✔️ ${document.name} has ${pageCount} pages with ${rawTextWordCount} words`,
  );
}
export async function getTextFromFile(
  fileBlob: Blob,
  fileType: string,
): Promise<{
  pageCount: number;
  rawText: string;
}> {
  if (fileType === SupportedFileTypes.TXT) {
    const rawText = await fileBlob.text();
    const wordCount = rawText
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
    const pageCount = Math.ceil(wordCount / AVERAGE_WORDS_PER_PAGE);

    return { pageCount, rawText };
  }

  if (fileType === SupportedFileTypes.PDF) {
    // Use existing PDF text extraction service
    const pdfData = await fileBlob.arrayBuffer();
    const pdf = await getDocumentProxy(pdfData);
    const { totalPages, text } = await unpdfExtractText(pdf);
    return {
      pageCount: totalPages,
      rawText: text.join("\n"),
    };
  }

  if (fileType === SupportedFileTypes.DOCX) {
    const text = await extractTextFromWord(fileBlob);
    // Estimate page count based on word count for Word documents
    const wordCount = text
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
    const pageCount = Math.max(
      1,
      Math.ceil(wordCount / AVERAGE_WORDS_PER_PAGE),
    );

    return {
      pageCount,
      rawText: text,
    };
  }

  throw new Error("Unsupported file type");
}
