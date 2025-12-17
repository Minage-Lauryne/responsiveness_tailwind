"use client";

import { ArrowRight, Plus, X, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChatType } from "@prisma/client";
import { api } from "@/trpc/react";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";
import { formatDistanceToNow } from "date-fns";
import { PaperclipIcon, SearchIcon } from "@/components/ui/icons";
import AddFilesButton from "@/components/ui/add-files-button";
import { useSubject } from "@/app/app/subject/components/use-subject";
import { useCreateAnalysisFromWorkspaceFiles } from "@/hooks/use-create-analysis-from-workspace-files";

interface UploadedFile {
  id: string;
  title: string;
  status: "uploading" | "success" | "error";
}

interface MessageInputProps {
  placeholder?: string;
  onSubmit?: (message: string) => void;
  showAddFiles?: boolean;
  className?: string;
  onStateChange?: (state: { 
    message: string; 
    files: UploadedFile[]; 
    hasContent: boolean;
    triggerSubmit: (chatType: ChatType) => Promise<void>;
  }) => void;
}

export function MessageInput({
  placeholder = "Ask anything...",
  onSubmit,
  showAddFiles = true,
  className = "",
  onStateChange,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showFileDialog, setShowFileDialog] = useState(false);
  
  const router = useRouter();
  const createSubjectMutation = api.subject.create.useMutation();
  const { data: workspaceFiles = [] } = api.files.list.useQuery();
  const { createAnalysis } = useCreateAnalysisFromWorkspaceFiles();
  const { files, addSelectedFile, removeFile, cancelUpload, clear: clearFiles } = useSubject();

  const successfulFiles = files.filter((f) => f.status === "success");
  const hasReadyFiles = successfulFiles.length > 0;
  const hasContent = message.trim().length > 0 || hasReadyFiles;

  const handleSubmitRef = useRef<(chatType: ChatType) => Promise<void>>();

  useEffect(() => {
    if (onStateChange && handleSubmitRef.current) {
      onStateChange({ 
        message, 
        files, 
        hasContent,
        triggerSubmit: handleSubmitRef.current
      });
    }
  }, [message, files, hasContent, onStateChange]);


  const handleUnselect = useCallback(
    (fileId: string, status: "uploading" | "success" | "error") => {
      if (status === "uploading") {
        cancelUpload(fileId);
      }
      removeFile(fileId);
    },
    [cancelUpload, removeFile],
  );

  const handleWorkspaceFileSelect = (fileId: string, fileName: string) => {
    addSelectedFile(fileId, fileName);
  };

  const handleSubmit = useCallback(async (chatType: ChatType = ChatType.ANALYSIS) => {
    if (!message.trim() && files.length === 0) return;
    
    if (onSubmit) {
      onSubmit(message);
      setMessage("");
      clearFiles();
      return;
    }

    const isUploading = files.some(f => f.status === "uploading");
    if (isUploading) {
      toast.error("Please wait for all files to finish uploading");
      return;
    }

    setIsLoading(true);
    
    try {
      let analysisId: string | undefined;

      if (hasReadyFiles) {
        const analysis = await createAnalysis({
          fileIds: successfulFiles.map((file) => file.id),
          context: message || undefined,
          chatType: chatType,
        });
        analysisId = analysis.id;
      }

      const subject = await createSubjectMutation.mutateAsync({
        context: message,
        files: successfulFiles.map((file) => file.id),
        djangoAnalysisId: analysisId,
        chatType: chatType,
      });

      clearFiles();
      setMessage("");
      
      const routeMap: Record<ChatType, string> = {
        [ChatType.ANALYSIS]: "analysis",
        [ChatType.LANDSCAPE_ANALYSIS]: "landscape",
        [ChatType.COUNTERPOINT]: "counterpoint",
        [ChatType.SUMMARY]: "summary",
        [ChatType.FINANCIAL_ANALYSIS]: "counterpoint",
        [ChatType.BIAS]: "bias",
        [ChatType.LEADERSHIP_ANALYSIS]: "leadership",
        [ChatType.PROGRAM_ANALYSIS]: "program",
        [ChatType.BOARD_MEMO]: "analysis",
        [ChatType.COMPREHENSIVE_REPORT]: "analysis",
        [ChatType.DISCUSSION_QUESTIONS]: "analysis",
        [ChatType.RELEVANT_RESEARCH]: "analysis",
        [ChatType.SITE_VISIT_PREP_GUIDE]: "analysis",
        [ChatType.STRATEGIC_PLANNING_GUIDE]: "analysis",
      };
      
      const route = routeMap[chatType] || "analysis";
      router.push(`/app/subject/${subject.id}/${route}`);
    } catch (error) {
      console.error("Analysis creation error:", error);
      toast.error("Failed to create analysis. Please try again.");
      setIsLoading(false);
    }
  }, [message, files, hasReadyFiles, successfulFiles, onSubmit, clearFiles, createAnalysis, createSubjectMutation, router]);

  handleSubmitRef.current = handleSubmit;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  return (
    <div className={className}>
      <div className="relative">
        <div className="w-full min-h-[120px] resize-none rounded-2xl border border-stone bg-[#F1F8FF] px-6 py-4 pr-16 pb-14">
          {files.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {files.map((file) => (
                <div
                  key={file.id}
                  className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm min-w-[200px] ${
                    file.status === "error"
                      ? "border-red-300 bg-red-50 text-red-700"
                      : file.status === "uploading"
                      ? "border-blue-300 bg-blue-50 text-blue-700"
                      : "border-green-300 bg-green-50 text-green-700"
                  }`}
                >
                  {file.status === "uploading" && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  {file.status === "success" && (
                    <CheckCircle className="h-3.5 w-3.5" />
                  )}
                  {file.status === "error" && (
                    <AlertCircle className="h-3.5 w-3.5" />
                  )}
                  <span className="font-medium truncate flex-1">{file.title}</span>
                  <button
                    onClick={() => handleUnselect(file.id, file.status)}
                    className="hover:opacity-70 ml-auto"
                    type="button"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <textarea
            placeholder={placeholder}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="w-full min-h-[60px] resize-none bg-transparent text-[21.98px] font-medium leading-[122%] placeholder:italic placeholder:text-granite focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed border-0 p-0"
            rows={2}
          />
        </div>
        
        {showAddFiles && (
          <div className="absolute bottom-6 left-8 z-10">
            <AddFilesButton />
          </div>
        )}
        
        <button
          onClick={() => void handleSubmit()}
          className={`absolute bottom-6 right-4 flex h-10 w-10 items-center justify-center rounded-full transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
            isLoading
              ? "bg-gradient-creamer text-espresso"
              : "bg-gradient-espresso text-white hover:bg-gradient-creamer hover:text-espresso active:bg-gradient-creamer active:text-espresso"
          }`}
          disabled={(!message.trim() && files.length === 0) || isLoading}
        >
          {isLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-espresso border-t-transparent" />
          ) : (
            <ArrowRight className="h-5 w-5" />
          )}
        </button>

        {/* AddFilesButton handles upload/search popup UI */}
      </div>
    </div>
  );
}
