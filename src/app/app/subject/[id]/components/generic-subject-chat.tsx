"use client";

import { Messages } from "@/features/chat/components/messages";
import { MultimodalInput } from "@/features/chat/components/multimodal-input";
import { Message, useChat } from "@ai-sdk/react";
import { createId } from "@paralleldrive/cuid2";
import { ChatType } from "@prisma/client";
import { useEffect, useRef, useState } from "react";
import { SubjectWithDocuments } from "./types";
import { api } from "@/trpc/react";
import { AIProviderError } from "./ai-provider-error";
import { TrialPaywall } from "@/components/trial-paywall";
import { AIDisclaimer } from "@/components/complere/ai-disclaimer";
import { useSingleAnalysis } from "@/hooks/use-single-analysis";
import { AnalysisType } from "@/types/single-analysis";
import { LoadingSpinner } from "@/features/shared/loading-spinner";
import { Send, FolderPlus, Tag, Copy, Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import jsPDF from "jspdf";
import "@/fonts/Montserrat-Regular";
import "@/fonts/Montserrat-Medium";
import "@/fonts/Montserrat-Bold";
import "@/fonts/Montserrat-Italic";
import { ShareAnalysisModal } from "./share-analysis-modal";

const USE_DJANGO_BACKEND = process.env.NEXT_PUBLIC_USE_DJANGO_BACKEND === "true";

function mapChatTypeToAnalysisType(chatType: ChatType): AnalysisType {
  return chatType as unknown as AnalysisType;
}

export function GenericSubjectChat({
  initialMessages,
  subject,
  chatId,
  chatType,
}: {
  initialMessages: Message[];
  subject: SubjectWithDocuments;
  chatId?: string;
  chatType: ChatType;
}) {
  const hasInitialized = useRef(false);
  const hasAttemptedCreation = useRef(false);
  const lastChatType = useRef<ChatType | null>(null);

  const [error, setError] = useState<boolean>(false);
  const [showTrialPaywall, setShowTrialPaywall] = useState<boolean>(false);
  const [isCreatingAnalysis, setIsCreatingAnalysis] = useState(false);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | undefined>();
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const updateAnalysisMutation = api.subject.updateDjangoAnalysisId.useMutation();

  const djangoAnalysisId = (() => {
    if (!subject.djangoAnalysisIds) return undefined;
    
    try {
      const analysisIds = subject.djangoAnalysisIds as Record<string, string>;
      return analysisIds[chatType];
    } catch (error) {
      console.error("Failed to parse djangoAnalysisIds:", error);
      return undefined;
    }
  })();

  useEffect(() => {
    if (lastChatType.current !== chatType) {
      lastChatType.current = chatType;
      hasAttemptedCreation.current = false;
      setCurrentAnalysisId(undefined);
      setError(false);
    }
  }, [chatType]);

  useEffect(() => {

    const hasContent = subject.documents.length > 0 || (subject.context && subject.context.trim().length > 0);
    
    if (
      USE_DJANGO_BACKEND &&
      !djangoAnalysisId &&
      !hasAttemptedCreation.current &&
      !isCreatingAnalysis &&
      !currentAnalysisId &&
      hasContent
    ) {
      hasAttemptedCreation.current = true;
      setIsCreatingAnalysis(true);

      const createAnalysis = async () => {
        try {
          console.log(`Creating ${chatType} analysis for subject ${subject.id}`);
          
          let response: Response;
          
          if (subject.documents.length > 0) {
            response = await fetch("/api/single-analysis/create-from-workspace", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify({
                fileIds: subject.documents.map((doc) => doc.id),
                context: subject.context,
                chatType: chatType,
              }),
            });
          } else {
            response = await fetch("/api/single-analysis/create", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify({
                message: subject.context,
                chat_type: chatType,
              }),
            });
          }

          if (!response.ok) {
            const errorData = await response.json();
            console.error("Django analysis creation failed:", errorData);
            throw new Error(errorData.error || "Failed to create Django analysis");
          }

          const analysis = await response.json() as { id: string };
          console.log(`Analysis created with ID: ${analysis.id}`);

          await updateAnalysisMutation.mutateAsync({
            subjectId: subject.id,
            chatType: chatType,
            analysisId: analysis.id,
          });

          setCurrentAnalysisId(analysis.id);
        } catch (err) {
          console.error("Failed to create analysis on-demand:", err);
          setError(true);
          hasAttemptedCreation.current = false; 
        } finally {
          setIsCreatingAnalysis(false);
        }
      };

      void createAnalysis();
    }
  }, [
    djangoAnalysisId,
    isCreatingAnalysis,
    currentAnalysisId,
    subject.documents,
    subject.context,
    subject.id,
    chatType,
    updateAnalysisMutation,
  ]);

  const effectiveAnalysisId = currentAnalysisId || djangoAnalysisId || chatId;

  const djangoChat = useSingleAnalysis({
    subjectId: subject.id,
    chatType: mapChatTypeToAnalysisType(chatType),
    initialMessages,
    analysisId: effectiveAnalysisId,
  });

  const aiSdkChat = useChat({
    id: chatId,
    generateId: createId,
    onResponse: (_response) => {
      setError(false);
      setShowTrialPaywall(false);
    },
    onError: (error) => {
      console.error("Chat error:", error);

      const errorString = JSON.stringify(error);
      const isTrialLimitError =
        (error instanceof Error && error.message.includes("402")) ||
        errorString.includes("402") ||
        errorString.includes("TRIAL_CHAT_LIMIT_EXCEEDED") ||
        (error instanceof Error && error.message.includes("trial"));

      if (isTrialLimitError) {
        console.log("Detected trial limit error");
        setShowTrialPaywall(true);
        return; 
      }

      setError(true);
    },
    experimental_prepareRequestBody({ messages, id }) {
      return {
        message: messages[messages.length - 1],
        id,
        selectedChatModel: chatType,
      };
    },
    api: `/api/subject/${subject.id}/chat`,
    initialMessages,
  });

  const chatHook = USE_DJANGO_BACKEND ? djangoChat : aiSdkChat;
  
  const {
    messages: rawMessages,
    status,
    input,
    stop,
    id,
  } = chatHook;

  const messages = rawMessages.map(msg => ({
    ...msg,
    parts: msg.parts ?? [{ type: "text" as const, text: msg.content }]
  }));

  type ChatRequestOptions = Record<string, unknown>;
  type CreateMessage = { role: "user" | "assistant" | "system" | "function" | "data" | "tool"; content: string; id?: string };
  
  const setMessages = chatHook.setMessages as (messages: Message[] | ((messages: Message[]) => Message[])) => void;
  const reload = chatHook.reload as (chatRequestOptions?: ChatRequestOptions) => Promise<string | null | undefined>;
  const append = chatHook.append as (message: Message | CreateMessage, chatRequestOptions?: ChatRequestOptions) => Promise<string | null | undefined>;
  const setInput = chatHook.setInput as React.Dispatch<React.SetStateAction<string>>;
  const handleSubmit = chatHook.handleSubmit as (event?: { preventDefault?: () => void }, chatRequestOptions?: ChatRequestOptions) => void;

  useEffect(() => {
    if (USE_DJANGO_BACKEND && djangoChat.error) {
      setError(true);
    }
  }, [djangoChat.error]);

  const { data: votes = [] } = api.chat.getVotes.useQuery(
    { chatId: id },
    { enabled: !!id },
  );

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    if (messages.length === 0) {
      void append({
        role: "user",
        content: "",
        id: createId(),
      });
    }
  }, []);

  if (showTrialPaywall) {
    return <TrialPaywall />;
  }

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

  const handleCopyAnalysis = async () => {
    try {
      const conversationText = messages
        .filter(msg => msg.content.trim().length > 0)
        .map(msg => {
          const role = msg.role === 'user' ? 'Question' : 'Response';
          return `${role}:\n${msg.content}\n`;
        })
        .join('\n---\n\n');

      const fullText = `${getAnalysisTitle()}\nSubject: ${subject.title || 'Analysis'}\n\n${'='.repeat(50)}\n\n${conversationText}`;

      await navigator.clipboard.writeText(fullText);
      
      setIsCopied(true);
      toast.success("Copied to clipboard", {
        description: "The entire analysis conversation has been copied.",
      });

      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (err) {
      toast.error("Copy failed", {
        description: "Failed to copy to clipboard. Please try again.",
      });
    }
  };

  const handleDownloadAnalysis = async () => {
    try {
      setIsDownloading(true);

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
              doc.setFillColor(240, 240, 240);
              const startY = yPosition;
              
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

      const filename = `${getAnalysisTitle().replace(/\s+/g, '_')}_${subject.title?.replace(/\s+/g, '_') || 'Analysis'}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      doc.save(filename);

      toast.success("PDF downloaded", {
        description: "The analysis has been downloaded as a PDF.",
      });

      setIsDownloading(false);
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Download failed", {
        description: "Failed to generate PDF. Please try again.",
      });
      setIsDownloading(false);
    }
  };

  if (isCreatingAnalysis) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <h3 className="mb-2 mt-4 text-lg font-semibold text-gray-900">
            Creating {chatType.toLowerCase().replace(/_/g, " ")} analysis...
          </h3>
          <p className="text-gray-600">
            This will take a moment. Please wait.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-w-0 flex-col">
        <div className="mx-auto w-full max-w-3xl px-4 pb-4 pt-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              {getAnalysisTitle()}
            </h1>
            <div className="flex items-center gap-1 rounded-full border border-gray-300 p-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-gray-100"
                title="Send"
                onClick={() => setShowShareModal(true)}
              >
                <Send className="h-3 w-3 text-gray-600" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-gray-100"
                title="Add to folder"
              >
                <FolderPlus className="h-3 w-3 text-gray-600" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-gray-100"
                title="Tag"
              >
                <Tag className="h-3 w-3 text-gray-600" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-gray-100"
                title="Copy"
                onClick={handleCopyAnalysis}
              >
                {isCopied ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3 text-gray-600" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-gray-100"
                title="Download"
                onClick={handleDownloadAnalysis}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                ) : (
                  <Download className="h-3 w-3 text-gray-600" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {error && <AIProviderError />}
        <Messages
          chatId={id}
          status={status}
          votes={votes}
          messages={messages}
          setMessages={setMessages}
          reload={reload}
          isReadonly={false}
          isArtifactVisible={false}
        />

        <form className="mx-auto flex w-full gap-2 px-4 pb-4 md:max-w-3xl md:pb-6">
          <MultimodalInput
            chatId={id}
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            status={status}
            stop={stop}
            attachments={[]}
            showAttachments={true}
            chatType={chatType}
            setAttachments={() => {
              return;
            }}
            messages={messages}
            setMessages={setMessages}
            append={append}
          />
        </form>
        <AIDisclaimer />
      </div>
      
      <ShareAnalysisModal
        subject={subject}
        chatType={chatType}
        messages={messages}
        open={showShareModal}
        onOpenChange={setShowShareModal}
      />
    </>
  );
}
