"use client";

import React, { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Upload, FileText, X, Loader2, AlertCircle, CheckCircle } from "lucide-react";

type SelectedFile = {
  file: File;
  status: "ready" | "uploading" | "error" | "success";
  errorMessage?: string;
};

type Props = {
  group: "rfp" | "proposal";
  multiple?: boolean;
  label?: string;
  onFilesChange?: (files: File[]) => void;
};

export function ComparativeFileUploadDropzone({
  multiple = false,
  label,
  onFilesChange,
}: Props) {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);

  const max_files = multiple ? 15 : 1;

  useEffect(() => {
    onFilesChange?.(selectedFiles.map((f) => f.file));
  }, [selectedFiles, onFilesChange]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setSelectedFiles((prev) => {
        const toAdd = acceptedFiles
          .slice(0, max_files - prev.length)
          .map((file) => ({ file, status: "ready" as const }));

        if (prev.length + acceptedFiles.length > max_files) {
          toast.error(
            multiple
              ? `Maximum 15 proposal files allowed`
              : `Only one RFP file allowed`
          );
        }

        const filesArr = multiple ? [...prev, ...toAdd] : toAdd;
        return filesArr;
      });

      if (acceptedFiles.length > 1) toast.success(`Added ${acceptedFiles.length} files`);
      else if (acceptedFiles.length === 1) toast.success(`Added: ${acceptedFiles[0]?.name}`);
    },
    [multiple, max_files]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple,
    // No size limit - files upload directly to Supabase Storage
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
        ".docx",
      ],
      "text/plain": [".txt"],
    },
    onDropRejected: (rejected) => {
      rejected.forEach(({ file }) => {
        toast.error(`Invalid file type: ${file.name}`);
      });
    },
  });

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      toast.info("File removed");
      return updated;
    });
  };

  const renderFileStatus = (file: SelectedFile) => {
    switch (file.status) {
      case "uploading":
        return (
          <div className="flex items-center gap-1 text-blue-600 text-xs ml-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Uploading...
          </div>
        );
      case "error":
        return (
          <div className="flex items-center gap-1 text-red-600 text-xs ml-2">
            <AlertCircle className="h-3 w-3" />
            {file.errorMessage || "Error"}
          </div>
        );
      case "success":
        return (
          <div className="flex items-center gap-1 text-green-600 text-xs ml-2">
            <CheckCircle className="h-3 w-3" />
            Ready
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1 text-green-600 text-xs ml-2">
            <CheckCircle className="h-3 w-3" />
            Ready
          </div>
        );
    }
  };

  const defaultLabel = multiple
    ? "Drop proposal files here, or click to browse"
    : "Drop your RFP file here, or click to browse";

  return (
    <div className="w-full space-y-4">
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          {selectedFiles.map((sf, idx) => (
            <div
              key={sf.file.name + idx}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors
                ${sf.status === "error"
                  ? "border-red-200 bg-red-50 text-red-800"
                  : sf.status === "uploading"
                  ? "border-blue-200 bg-blue-50 text-blue-800"
                  : "border-green-200 bg-green-50 text-green-800"
                }`}
              style={{ width: "100%" }}
            >
              <FileText className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1 truncate font-medium">
                {sf.file.name}
              </span>
              {renderFileStatus(sf)}
              <button
                type="button"
                onClick={() => handleRemoveFile(idx)}
                className="ml-2 text-current opacity-60 hover:opacity-100"
                aria-label="Remove"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto mb-3 h-8 w-8 text-gray-400" />
        <div className="mb-2 text-sm font-medium text-gray-900">
          {label ?? defaultLabel}
        </div>
        <div className="text-xs text-gray-500">
          Supports PDF, DOC, DOCX, and TXT (any size)
          {multiple && " • Max 15 proposals"}
        </div>
      </div>
    </div>
  );
}