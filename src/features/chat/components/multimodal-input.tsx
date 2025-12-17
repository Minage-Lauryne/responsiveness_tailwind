"use client";

import type { Attachment, UIMessage } from "ai";
import cx from "classnames";
import type React from "react";
import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from "react";
import { toast } from "sonner";
import { useSubject } from "@/app/app/subject/components/use-subject";
import { useLocalStorage, useWindowSize } from "usehooks-ts";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UseChatHelpers } from "@ai-sdk/react";
import { ChatType } from "@prisma/client";
import equal from "fast-deep-equal";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, FileText, Search, Paperclip, Loader2, CheckCircle, AlertCircle, X } from "lucide-react";
import Image from "next/image";
import { StopIcon } from "./icons";
import { api } from "@/trpc/react";
import AddFilesButton from "@/components/ui/add-files-button";
import { SuggestedActions } from "./suggested-actions";
import { useScrollToBottom } from "./use-scroll-to-bottom";

function PureMultimodalInput({
  chatId,
  input,
  chatType,
  setInput,
  status,
  stop,
  attachments,
  setAttachments,
  messages,
  setMessages,
  append,
  handleSubmit,
  className,
  showAttachments = true,
}: {
  chatId: string;
  input: UseChatHelpers["input"];
  setInput: UseChatHelpers["setInput"];
  status: UseChatHelpers["status"];
  chatType: ChatType;
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers["setMessages"];
  append: UseChatHelpers["append"];
  handleSubmit: UseChatHelpers["handleSubmit"];
  className?: string;
  showAttachments?: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  };

  const resetHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = "98px";
    }
  };

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    "input",
    "",
  );

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      const finalValue = domValue || localStorageInput || "";
      setInput(finalValue);
      adjustHeight();
    }
  }, []);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    adjustHeight();
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const submitForm = useCallback(() => {

    handleSubmit(undefined, {
      experimental_attachments: attachments,
    });

    setAttachments([]);
    setLocalStorageInput("");
    resetHeight();

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [attachments, handleSubmit, setAttachments, setLocalStorageInput, width]);

  const getUploadUrlMutation = api.files.getUploadUrl.useMutation();
  const createDocumentMutation = api.files.createUserDocument.useMutation();
  const { addUploadingFile, updateFileProgress, updateFileStatus, setUploadController, removeFile, cancelUpload, files: subjectFiles } = useSubject();

  const uploadFile = async (file: File) => {
    const fileId = addUploadingFile(file);
    const abortController = new AbortController();
    setUploadController(fileId, abortController);

    try {
      updateFileProgress(fileId, "Preparing upload...");
      const uploadData = await getUploadUrlMutation.mutateAsync({ fileName: file.name });

      updateFileProgress(fileId, "Uploading to storage...");
      const uploadResponse = await fetch(uploadData.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type, "x-upsert": "true" },
        body: file,
        signal: abortController.signal,
      });

      if (!uploadResponse.ok) throw new Error("Upload failed");
      if (abortController.signal.aborted) return;

      updateFileProgress(fileId, "Finalizing...");
      await createDocumentMutation.mutateAsync({ id: fileId, fileName: file.name, fileType: file.type, filePath: uploadData.path, fileSize: file.size });

      updateFileStatus(fileId, "success");

      return {
        url: uploadData.publicUrl ?? uploadData.path,
        name: uploadData.path,
        contentType: file.type,
      };
    } catch (err) {
      console.error("Failed to upload file:", err);
      updateFileStatus(fileId, "error", err instanceof Error ? err.message : "Upload failed");
      toast.error("Failed to upload file, please try again!");
    }
  };

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) => attachment !== undefined,
        );

        if (successfullyUploadedAttachments.length > 0) {
          setAttachments((currentAttachments) => [
            ...currentAttachments,
            ...successfullyUploadedAttachments,
          ]);
        }
      } catch (error) {
        console.error("Error uploading files!", error);
      }
    },
    [setAttachments, uploadFile],
  );

  const { isAtBottom, scrollToBottom } = useScrollToBottom();

  useEffect(() => {
    if (status === "submitted") {
      scrollToBottom();
    }
  }, [status, scrollToBottom]);

  if (messages.length <= 2 && status !== "ready") {
    return null;
  }

  return (
    <div className="relative flex w-full flex-col gap-4">
      <AnimatePresence>
        {!isAtBottom && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="absolute bottom-28 left-1/2 z-50 -translate-x-1/2"
          >
            <Button
              data-testid="scroll-to-bottom-button"
              className="rounded-full"
              size="icon"
              variant="outline"
              onClick={(event) => {
                event.preventDefault();
                scrollToBottom();
              }}
            >
              <ArrowDown />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* {messages.length === 0 &&
        attachments.length === 0 &&
        uploadQueue.length === 0 && (
          <SuggestedActions
            append={append}
            chatId={chatId}
            // selectedVisibilityType={selectedVisibilityType}
          />
        )} */}

      {!subjectFiles.some((f) => f.status === "uploading") &&
        status === "ready" &&
        messages.length > 0 && (
          <SuggestedActions
            append={append}
            chatId={chatId}
            chatType={chatType}
          />
        )}

      <input
        type="file"
        className="pointer-events-none fixed -left-4 -top-4 size-0.5 opacity-0"
        ref={fileInputRef}
        disabled={status !== "ready"}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
      />

      <div className={cx("relative w-full min-h-[120px] rounded-2xl border border-stone bg-[#F1F8FF] px-6 py-4 pr-16 pb-14", className)}>
        {subjectFiles.filter((f) => f.group !== "workspace").length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {subjectFiles.filter((f) => f.group !== "workspace").map((file) => (
              <div
                key={file.id}
                className={`flex items-center gap-2 rounded-md border px-3 py-1 text-sm min-w-[160px] ${
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
                <span className="font-medium truncate text-sm flex-1">{file.title}</span>
                <button
                  onClick={() => {
                    if (file.status === "uploading") {
                      cancelUpload(file.id);
                    }
                    removeFile(file.id);
                  }}
                  className="hover:opacity-70 ml-auto"
                  type="button"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <Textarea
          data-testid="multimodal-input"
          ref={textareaRef}
          placeholder="Ask a question. Go further with your analysis..."
          value={input}
          onChange={handleInput}
          className={cx(
            "max-h-[calc(75dvh)] min-h-[24px] resize-none overflow-hidden bg-transparent pb-0 pl-0 pt-0 !text-base placeholder:italic placeholder:text-sm w-full border-0 outline-none focus-visible:ring-0",
          )}
          rows={2}
          autoFocus
        onKeyDown={(event) => {
          if (
            event.key === "Enter" &&
            !event.shiftKey &&
            !event.nativeEvent.isComposing
          ) {
            event.preventDefault();

            if (status !== "ready") {
              toast.error("Please wait for the model to finish its response!");
            } else {
              submitForm();
            }
          }
        }}
      />
          <div className="absolute bottom-6 left-6 z-10">
            <AddFilesButton externalFileInputRef={fileInputRef} disabled={status !== "ready"} />
          </div>
        </div>

      <div className="absolute bottom-0 right-0 flex w-fit flex-row justify-end p-2">
        {status === "submitted" ? (
          <StopButton stop={stop} setMessages={setMessages} />
        ) : (
          <SendButton
            input={input}
            submitForm={submitForm}
            isUploading={subjectFiles.some((f) => f.status === "uploading")}
          />
        )}
      </div>
    </div>
  );
}

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) return false;
    if (prevProps.status !== nextProps.status) return false;
    if (!equal(prevProps.attachments, nextProps.attachments)) return false;

    return true;
  },
);

function PureStopButton({
  stop,
  setMessages,
}: {
  stop: () => void;
  setMessages: UseChatHelpers["setMessages"];
}) {
  return (
    <Button
      data-testid="stop-button"
      className="h-fit rounded-full border p-1.5 dark:border-zinc-600"
      onClick={(event) => {
        event.preventDefault();
        stop();
        setMessages((messages) => messages);
      }}
    >
      <StopIcon size={14} />
    </Button>
  );
}

const StopButton = memo(PureStopButton);

function PureSendButton({
  submitForm,
  input,
  isUploading,
}: {
  submitForm: () => void;
  input: string;
  isUploading: boolean;
}) {
  return (
    <Button
      data-testid="send-button"
      className="h-fit rounded-full border-0 bg-transparent p-1.5 hover:bg-transparent focus:bg-transparent active:bg-transparent"
      onClick={(event) => {
        event.preventDefault();
        submitForm();
      }}
      disabled={input.length === 0 || isUploading}
    >
      <Image
        src="/icons/send.svg"
        alt="Send"
        width={16}
        height={16}
        className="h-6 w-6 mb-3"
      />
    </Button>
  );
}

const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
  if (prevProps.isUploading !== nextProps.isUploading) return false;
  if (prevProps.input !== nextProps.input) return false;
  return true;
});
