"use client";

import { useState } from "react";
import { ChatType } from "@prisma/client";
import { Mail } from "lucide-react";
import { LoadingButton } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { api } from "@/trpc/react";
import { SubjectWithDocuments } from "./types";
import { Message } from "@ai-sdk/react";
import jsPDF from "jspdf";
import "@/fonts/Montserrat-Regular";
import "@/fonts/Montserrat-Medium";
import "@/fonts/Montserrat-Bold";
import "@/fonts/Montserrat-Italic";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid recipient email address"),
});

type EmailType = z.infer<typeof emailSchema>;

interface ShareEmailFormProps {
  subject: SubjectWithDocuments;
  chatType: ChatType;
  messages: Message[];
  onSuccess: () => void;
  senderEmail: string;
  organizationId: string;
}

export function ShareEmailForm({
  subject,
  chatType,
  messages,
  onSuccess,
  senderEmail,
  organizationId,
}: ShareEmailFormProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const form = useForm<EmailType>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
    },
  });

  const sendEmailWithPdf = api.email.sendAnalysisEmail.useMutation();

  const getAnalysisTitle = () => {
    switch (chatType) {
      case ChatType.LANDSCAPE_ANALYSIS:
        return "Landscape Analysis";
      case ChatType.ANALYSIS:
        return "Summary Analysis";
      case ChatType.FINANCIAL_ANALYSIS:
        return "Financial Analysis";
      case ChatType.BIAS:
        return "Bias Analysis";
      case ChatType.LEADERSHIP_ANALYSIS:
        return "Leadership Analysis";
      case ChatType.PROGRAM_ANALYSIS:
        return "Program Analysis";
      default:
        return "Analysis";
    }
  };

  const generatePdfBuffer = async (): Promise<Buffer> => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    const logoImg = new Image();
    logoImg.src = '/logo/logo-primary.png';
    await new Promise((resolve, reject) => {
      logoImg.onload = resolve;
      logoImg.onerror = reject;
    });

    const logoWidth = 35;
    const logoHeight = (logoImg.height / logoImg.width) * logoWidth;
    doc.addImage(logoImg, 'PNG', margin, yPosition, logoWidth, logoHeight);
    
    yPosition += logoHeight + 15;

    const checkAddPage = (neededSpace: number) => {
      if (yPosition + neededSpace > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    const renderText = (text: string, x: number, options: { 
      fontSize?: number; 
      fontStyle?: 'normal' | 'bold' | 'italic'; 
      lineHeight?: number;
    } = {}) => {
      const fontSize = options.fontSize || 10;
      const fontStyle = options.fontStyle || 'normal';
      const lineHeight = options.lineHeight || 7;

      doc.setFontSize(fontSize);
      const fontName = fontStyle === 'bold' ? 'Montserrat-Bold' : fontStyle === 'italic' ? 'Montserrat-Italic' : 'Montserrat-Regular';
      doc.setFont(fontName);

      const lines = doc.splitTextToSize(text, maxWidth - (x - margin));
      
      for (const line of lines) {
        checkAddPage(lineHeight);
        doc.text(line, x, yPosition);
        yPosition += lineHeight;
      }
    };

    const processMarkdown = (text: string) => {
      const lines = text.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (!line || line.trim() === '') {
          yPosition += 3;
          continue;
        }

        if (line.startsWith('### ')) {
          checkAddPage(10);
          renderText(line.substring(4), margin, { fontSize: 12, fontStyle: 'bold', lineHeight: 8 });
          yPosition += 2;
        } else if (line.startsWith('## ')) {
          checkAddPage(12);
          renderText(line.substring(3), margin, { fontSize: 14, fontStyle: 'bold', lineHeight: 9 });
          yPosition += 3;
        } else if (line.startsWith('# ')) {
          checkAddPage(14);
          renderText(line.substring(2), margin, { fontSize: 16, fontStyle: 'bold', lineHeight: 10 });
          yPosition += 4;
        }
        else if (line && (line.trim().startsWith('- ') || line.trim().startsWith('* '))) {
          const indent = line.search(/[*-]/);
          const content = line.substring(line.indexOf(' ') + 1);
          if (indent !== -1 && content) {
            checkAddPage(7);
            doc.setFontSize(10);
            doc.setFont('Montserrat-Regular');
            doc.text('•', margin + indent * 2, yPosition);
            renderText(content, margin + indent * 2 + 5, { fontSize: 10, lineHeight: 6 });
          }
        }
        else if (line && /^\d+\.\s/.test(line.trim())) {
          const match = line.match(/^(\s*)(\d+)\.\s(.+)/);
          if (match && match[1] !== undefined && match[2] && match[3]) {
            const indent = match[1];
            const number = match[2];
            const content = match[3];
            checkAddPage(7);
            doc.setFontSize(10);
            doc.setFont('Montserrat-Regular');
            doc.text(`${number}.`, margin + indent.length * 2, yPosition);
            renderText(content, margin + indent.length * 2 + 8, { fontSize: 10, lineHeight: 6 });
          }
        }
        else if (line.includes('**') || line.includes('__')) {
          checkAddPage(7);
          const cleanLine = line.replace(/\*\*(.+?)\*\*/g, '$1').replace(/__(.+?)__/g, '$1');
          renderText(cleanLine, margin, { fontSize: 10, fontStyle: 'bold', lineHeight: 6 });
        }
        else if ((line.includes('*') && !line.includes('**')) || (line.includes('_') && !line.includes('__'))) {
          checkAddPage(7);
          const cleanLine = line.replace(/\*(.+?)\*/g, '$1').replace(/_(.+?)_/g, '$1');
          renderText(cleanLine, margin, { fontSize: 10, fontStyle: 'italic', lineHeight: 6 });
        }
        else if (line.trim().startsWith('```')) {
          if (!line.trim().endsWith('```')) {
            i++;
            checkAddPage(10);
            const codeLines: string[] = [];
            while (i < lines.length && lines[i] && !lines[i]!.trim().startsWith('```')) {
              codeLines.push(lines[i]!);
              i++;
            }
            
            doc.setFont('courier', 'normal');
            doc.setFontSize(9);
            for (const codeLine of codeLines) {
              if (codeLine) {
                checkAddPage(6);
                doc.text(codeLine, margin + 5, yPosition);
                yPosition += 6;
              }
            }
            
            yPosition += 3;
          }
        }
        else {
          renderText(line, margin, { fontSize: 10, lineHeight: 6 });
        }
      }
    };

    doc.setFontSize(22);
    doc.setFont('Montserrat-Bold');
    doc.setTextColor(30, 30, 30);
    doc.text(getAnalysisTitle(), margin, yPosition);
    yPosition += 10;

    doc.setFontSize(11);
    doc.setFont('Montserrat-Regular');
    doc.setTextColor(60, 60, 60);
    doc.text(`Subject: ${subject.title || 'Untitled'}`, margin, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
    yPosition += 15;

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    const filteredMessages = messages.filter(msg => msg.content.trim().length > 0);
    
    for (let i = 0; i < filteredMessages.length; i++) {
      const msg = filteredMessages[i];
      if (!msg) continue;
      
      const role = msg.role === 'user' ? 'Question' : 'Response';
      
      checkAddPage(15);
      doc.setFontSize(12);
      doc.setFont('Montserrat-Bold');
      doc.setTextColor(0, 0, 0);
      doc.text(`${role} ${i + 1}:`, margin, yPosition);
      yPosition += 8;

      doc.setTextColor(0, 0, 0);
      processMarkdown(msg.content);
      
      yPosition += 8;
      
      if (i < filteredMessages.length - 1) {
        checkAddPage(5);
        doc.setDrawColor(220, 220, 220);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;
      }
    }

    const pdfBlob = doc.output('blob');
    const arrayBuffer = await pdfBlob.arrayBuffer();
    return Buffer.from(arrayBuffer);
  };

  const onSubmit = async (values: EmailType) => {
    try {
      setIsGenerating(true);
      
      const pdfBuffer = await generatePdfBuffer();
      const base64Pdf = pdfBuffer.toString('base64');
      
      const filename = `${getAnalysisTitle().replace(/\\s+/g, '_')}_${subject.title?.replace(/\\s+/g, '_') || 'Analysis'}_${new Date().toISOString().split('T')[0]}.pdf`;

      sendEmailWithPdf.mutate(
        {
          recipientEmail: values.email.trim(),
          senderEmail: senderEmail.trim(),
          organizationId: organizationId.trim(),
          subjectTitle: subject.title || 'Analysis',
          analysisTitle: getAnalysisTitle(),
          pdfBase64: base64Pdf,
          pdfFilename: filename,
        },
        {
          onSuccess: () => {
            toast.success(`Analysis sent to ${values.email}`);
            form.reset();
            onSuccess();
          },
          onError: (error: { message?: string }) => {
            toast.error(error.message || "Failed to send email");
          },
          onSettled: () => {
            setIsGenerating(false);
          },
        }
      );
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF");
      setIsGenerating(false);
    }
  };

  const isLoading = isGenerating || sendEmailWithPdf.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="colleague@company.com"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
          <div className="flex items-start gap-2">
            <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm text-blue-800 font-medium">What happens next:</p>
              <ul className="text-sm text-blue-700 mt-1 space-y-1">
                <li>• A professional PDF report will be generated</li>
                <li>• The report will be emailed directly to the recipient</li>
                <li>• You'll receive a confirmation once it's sent</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <LoadingButton type="submit" isLoading={isLoading}>
            <Mail className="mr-2 h-4 w-4" />
            {isGenerating ? "Generating PDF..." : "Send Report via Email"}
          </LoadingButton>
        </div>
      </form>
    </Form>
  );
}
