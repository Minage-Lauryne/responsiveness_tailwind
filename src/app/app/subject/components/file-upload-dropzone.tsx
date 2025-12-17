"use client";

import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { api } from "@/trpc/react";
import { Command as CommandPrimitive } from "cmdk";
import { formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  CheckCircle,
  FileText,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import * as React from "react";
import { useCallback, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { useSubject } from "./use-subject";

export function FileUploadDropzone() {
  const { files, cancelUpload, removeFile, addSelectedFile } = useSubject();
  const { uploadFiles } = useFileUpload();
  const { data: workspaceFiles = [] } = api.files.list.useQuery();

  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: uploadFiles,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "text/plain": [".txt"],
    },
    multiple: true,
    // No size limit - files upload directly to Supabase Storage
    onDropRejected: (rejectedFiles) => {
      rejectedFiles.forEach((file) => {
        toast.error(`File rejected: ${file.file.name}`);
      });
    },
  });

  const handleUnselect = useCallback(
    (file: (typeof files)[0]) => {
      if (file.status === "uploading") {
        cancelUpload(file.id);
      }
      removeFile(file.id);
    },
    [cancelUpload, removeFile],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && inputValue === "" && files.length > 0) {
        const lastFile = files[files.length - 1];
        if (lastFile) {
          removeFile(lastFile.id);
        }
      }
    },
    [files, removeFile, inputValue],
  );

  const filteredFiles = useMemo(() => {
    const availableFiles = workspaceFiles.filter(
      (file) => !files.some((selected) => selected.id === file.id),
    );

    if (!inputValue) return availableFiles;

    return availableFiles.filter((file) =>
      file.name.toLowerCase().includes(inputValue.toLowerCase()),
    );
  }, [workspaceFiles, files, inputValue]);

  const renderFileStatus = (file: (typeof files)[0]) => {
    if (file.status === "uploading") {
      return (
        <div className="flex items-center space-x-1">
          <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
          <span className="text-xs text-blue-600">
            {file.uploadProgress || "Uploading..."}
          </span>
        </div>
      );
    }
    if (file.status === "error") {
      return (
        <div className="flex items-center space-x-1">
          <AlertCircle className="h-3 w-3 text-red-500" />
          <span className="text-xs text-red-600">
            {file.error || "Upload failed - please try again"}
          </span>
        </div>
      );
    }
    return (
      <div className="flex items-center space-x-1">
        <CheckCircle className="h-3 w-3 text-green-500" />
        <span className="text-xs text-green-600">Ready</span>
      </div>
    );
  };

  const isUploading = files.some((f) => f.status === "uploading");

  return (
    <div className="w-[842.58px] h-[147.45px] space-y-4">
      <div
        {...getRootProps()}
        className={`relative cursor-pointer rounded-[15.05px] p-6 text-center transition-colors ${isDragActive ? "bg-blue-50" : ""
          } ${isUploading ? "opacity-50" : ""}`}
        style={{
          background: isDragActive
            ? '#EFF6FF'
            : 'transparent',
          backgroundImage: isDragActive
            ? `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='15.05' ry='15.05' stroke='%233B82F6' stroke-width='3.5' stroke-dasharray='6.018420219421387%2c 6.018420219421387' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e")`
            : `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='15.05' ry='15.05' stroke='%23A59B92' stroke-width='3.5' stroke-dasharray='6.018420219421387%2c 6.018420219421387' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e")`
        }}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto mb-2 w-8 text-gray-400" />
        <div className="mb-1 text-base font-medium text-gray-900">
          Drop new files here, or click to browse
        </div>
        <div className="text-xs text-gray-500">
          Supports PDF, DOC, DOCX, and TXT files (any size)
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-sm text-gray-600">
          Choose files from your workspace to include in the program evaluation
        </div>
        <div className="w-full">
          <Command className="overflow-visible">
            <div className="rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <div className="flex flex-wrap gap-2">
                {files.map((file) => {
                  const statusElement = renderFileStatus(file);
                  return (
                    <div
                      key={file.id}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${file.status === "error"
                        ? "border-red-200 bg-red-50 text-red-800"
                        : file.status === "uploading"
                          ? "border-blue-200 bg-blue-50 text-blue-800"
                          : "border-green-200 bg-green-50 text-green-800"
                        }`}
                    >
                      <FileText className="h-4 w-4 flex-shrink-0" />
                      <span className="font-medium">{file.title}</span>
                      {statusElement}
                      <X
                        className="ml-1 h-4 w-4 cursor-pointer text-current opacity-60 hover:opacity-100"
                        onMouseDown={(e) => {
                          e.preventDefault();
                        }}
                        onClick={() => {
                          handleUnselect(file);
                        }}
                      />
                    </div>
                  );
                })}
                <CommandPrimitive.Input
                  onKeyDown={handleKeyDown}
                  onValueChange={setInputValue}
                  value={inputValue}
                  onBlur={() => setOpen(false)}
                  onFocus={() => setOpen(true)}
                  placeholder="Search your workspace files..."
                  className="ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>
            <div className="relative mt-2">
              <CommandList>
                {open && !!filteredFiles.length && (
                  <div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none">
                    <CommandGroup className="h-full max-h-60 overflow-auto">
                      {filteredFiles.map((file) => {
                        return (
                          <CommandItem
                            key={file.id}
                            value={`${file.id}-${file.name}`}
                            onMouseDown={(e) => {
                              e.preventDefault();
                            }}
                            onSelect={() => {
                              setInputValue("");
                              addSelectedFile(file.id, file.name);
                              setOpen(false);
                              (document.activeElement as HTMLElement)?.blur();
                            }}
                            className={"cursor-pointer"}
                          >
                            <div className="flex w-full flex-col">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span>{file.name}</span>
                              </div>
                              <span className="ml-4 text-xs text-muted-foreground">
                                {file.isUploadedByCurrentUser
                                  ? `uploaded ${formatDistanceToNow(new Date(file.createdAt), {
                                    addSuffix: true,
                                  })}`
                                  : `uploaded by ${file.addedBy.firstName || "someone"} ${formatDistanceToNow(new Date(file.createdAt), {
                                    addSuffix: true,
                                  })}`}
                              </span>
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </div>
                )}
              </CommandList>
            </div>
          </Command>
        </div>
      </div>
    </div>
  );
}

function useFileUpload() {
  const {
    addUploadingFile,
    updateFileStatus,
    updateFileProgress,
    setUploadController
  } = useSubject();
  const getUploadUrlMutation = api.files.getUploadUrl.useMutation();
  const createDocumentMutation = api.files.createUserDocument.useMutation();

  const uploadFile = useCallback(
    async (file: File) => {
      const fileId = addUploadingFile(file);
      const abortController = new AbortController();
      setUploadController(fileId, abortController);

      try {
        // Step 1: Generate signed upload URL 
        updateFileProgress(fileId, "Preparing upload...");
        const uploadData = await getUploadUrlMutation.mutateAsync({
          fileName: file.name,
        });

        // Step 2: Upload file directly to Supabase
        updateFileProgress(fileId, "Uploading to storage...");
        const uploadResponse = await fetch(uploadData.signedUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type,
            "x-upsert": "true",
          },
          body: file,
          signal: abortController.signal,
        });

        if (!uploadResponse.ok) {
          throw new Error("Upload failed");
        }

        if (abortController.signal.aborted) {
          return;
        }

        // Step 3: Create document record in database
        updateFileProgress(fileId, "Finalizing...");
        await createDocumentMutation.mutateAsync({
          id: fileId,
          fileName: file.name,
          fileType: file.type,
          filePath: uploadData.path,
        });

        updateFileStatus(fileId, "success");
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          updateFileStatus(fileId, "error", "Upload cancelled");
          return;
        }

        console.error("Upload error:", error);
        updateFileStatus(fileId, "error", "Upload failed");
        toast.error(
          `We've had an error uploading ${file.name}. Please try again.`,
        );
      }
    },
    [
      addUploadingFile,
      updateFileStatus,
      updateFileProgress,
      getUploadUrlMutation,
      createDocumentMutation,
      setUploadController,
    ],
  );

  const uploadFiles = useCallback(
    (files: File[]) => {
      void Promise.all(files.map(uploadFile));
    },
    [uploadFile],
  );

  return { uploadFiles };
}