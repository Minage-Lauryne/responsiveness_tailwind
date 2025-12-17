"use client";

import { Button } from "@/components/ui/button";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadList,
  FileUploadProps,
  FileUploadTrigger,
} from "@/components/ui/file-upload";
import { api } from "@/trpc/react";
import { createId } from "@paralleldrive/cuid2";
import axios from "axios";
import { Upload, X } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

export function RequestFileUpload({
  onDocumentAdded,
  onUploadStateChange,
}: {
  onDocumentAdded: (documentId: string) => void;
  onUploadStateChange?: (isUploading: boolean) => void;
}) {
  const [files, setFiles] = React.useState<File[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);

  const onFileReject = React.useCallback((file: File, message: string) => {
    toast(message, {
      description: `"${file.name.length > 20 ? `${file.name.slice(0, 20)}...` : file.name}" has been rejected`,
    });
  }, []);

  const getSignedUrlMutation = api.files.getUploadUrl.useMutation();
  const createDocumentMutation = api.files.createUserDocument.useMutation();

  const onUpload: NonNullable<FileUploadProps["onUpload"]> = React.useCallback(
    async (files, { onProgress, onSuccess, onError }) => {
      setIsUploading(true);
      onUploadStateChange?.(true);

      try {
        // Process each file in series
        for (const file of files) {
          const abortController = new AbortController();
          const id = createId();

          try {
            // Get signed URL for upload
            const uploadData = await getSignedUrlMutation.mutateAsync({
              fileName: file.name,
            });

            // Report initial progress
            onProgress(file, 0);

            // Upload file using axio s with progress tracking
            await axios.put(uploadData.signedUrl, file, {
              headers: {
                "Content-Type": file.type,
                "x-upsert": "true",
              },
              signal: abortController.signal,
              onUploadProgress: (progressEvent) => {
                console.log("Progress event:", {
                  loaded: progressEvent.loaded,
                  total: progressEvent.total,
                  file: file.name,
                });

                // Handle case where total is unknown
                if (progressEvent.total && progressEvent.total > 0) {
                  const progress =
                    (progressEvent.loaded / progressEvent.total) * 100;
                  onProgress(file, Math.min(progress, 100));
                } else if (progressEvent.loaded > 0) {
                  // If we don't know the total but have loaded data, show indeterminate progress
                  // You might want to show a different UI state here
                  onProgress(file, 50); // Or handle this case differently
                }
              },
            });

            // Check if upload was aborted
            if (abortController.signal.aborted) {
              continue;
            }

            // Report 100% completion
            onProgress(file, 100);

            await createDocumentMutation.mutateAsync({
              id,
              fileName: file.name,
              fileType: file.type,
              filePath: uploadData.path,
            });
            onDocumentAdded(id);

            onSuccess(file);
          } catch (error) {
            if (axios.isCancel(error)) {
              // Upload was cancelled, continue to next file
              continue;
            }

            onError(
              file,
              error instanceof Error ? error : new Error("Upload failed"),
            );
          }
        }
      } catch (error) {
        // This handles any error that might occur outside the individual upload processes
        console.error("Unexpected error during upload:", error);
        toast.error("Upload failed");
      } finally {
        setIsUploading(false);
        onUploadStateChange?.(false);
      }
    },
    [
      createDocumentMutation,
      getSignedUrlMutation,
      onDocumentAdded,
      onUploadStateChange,
    ],
  );

  return (
    <FileUpload
      maxFiles={2}
      maxSize={5 * 1024 * 1024}
      className="mx-auto w-full max-w-md"
      value={files}
      onUpload={onUpload}
      onValueChange={setFiles}
      onFileReject={onFileReject}
      multiple
    >
      <FileUploadDropzone>
        <div className="flex flex-col items-center gap-1 text-center">
          <div className="flex items-center justify-center rounded-full border p-2.5">
            <Upload className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">
            {isUploading ? "Uploading files..." : "Additional Files"}
          </p>
          <p className="text-xs text-muted-foreground">
            {isUploading
              ? "Please wait while files are being uploaded"
              : "Or click to browse (max 2 files, up to 5MB each)"}
          </p>
        </div>
        <FileUploadTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 w-fit"
            disabled={isUploading}
          >
            {isUploading ? "Uploading..." : "Browse files"}
          </Button>
        </FileUploadTrigger>
      </FileUploadDropzone>
      <FileUploadList>
        {files.map((file, index) => (
          <FileUploadItem key={index} value={file}>
            <FileUploadItemPreview />
            <FileUploadItemMetadata />
            <FileUploadItemDelete asChild>
              <Button variant="ghost" size="icon" className="size-7">
                <X />
              </Button>
            </FileUploadItemDelete>
          </FileUploadItem>
        ))}
      </FileUploadList>
    </FileUpload>
  );
}
