"use client";

import { useState, useCallback } from "react";
import { sanitizeFilename } from "@/lib/filename-utils";
import type {
  GenerateUploadURLsRequest,
  GenerateUploadURLsResponse,
  CreateAnalysisRequest,
  SingleAnalysisResponse,
  AnalysisType,
} from "@/types/single-analysis";

interface UploadProgress {
  filename: string;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
}

interface UseSingleAnalysisWithFilesReturn {
  uploadAndAnalyze: (
    files: File[],
    options: {
      query?: string;
      chatType: AnalysisType;
      parentAnalysisId?: string;
      onProgress?: (progress: UploadProgress[]) => void;
    }
  ) => Promise<SingleAnalysisResponse>;
  loading: boolean;
  error: Error | null;
  progress: UploadProgress[];
}

export function useSingleAnalysisWithFiles(): UseSingleAnalysisWithFilesReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState<UploadProgress[]>([]);

  const uploadAndAnalyze = useCallback(
    async (
      files: File[],
      {
        query,
        chatType,
        parentAnalysisId,
        onProgress,
      }: {
        query?: string;
        chatType: AnalysisType;
        parentAnalysisId?: string;
        onProgress?: (progress: UploadProgress[]) => void;
      }
    ): Promise<SingleAnalysisResponse> => {
      setLoading(true);
      setError(null);

      const initialProgress: UploadProgress[] = files.map((file) => ({
        filename: file.name,
        progress: 0,
        status: "pending",
      }));
      setProgress(initialProgress);
      onProgress?.(initialProgress);

      try {
        // Step 1: Generate upload URLs
        console.log("[Step 1/3] Generating upload URLs...");
        
        const sanitizedFilenames = files.map((f) => sanitizeFilename(f.name));
        
        const generateRequest: GenerateUploadURLsRequest = {
          filenames: sanitizedFilenames,
          chat_type: chatType,
          parent_analysis_id: parentAnalysisId,
        };

        const urlsResponse = await fetch("/api/single-analysis/generate-upload-urls", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(generateRequest),
        });

        if (!urlsResponse.ok) {
          const errorData = await urlsResponse.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to generate upload URLs: ${urlsResponse.status}`);
        }

        const urlsData: GenerateUploadURLsResponse = await urlsResponse.json();
        console.log(`[Step 1/3] Generated ${urlsData.document_uploads.length} upload URLs`);

        // Step 2: Upload files to Supabase
        console.log("[Step 2/3] Uploading files to storage...");
        
        const fileMap = new Map(files.map((f) => [sanitizeFilename(f.name), f]));
        
        const uploadPromises = urlsData.document_uploads.map(async (upload) => {
          const file = fileMap.get(upload.filename);
          if (!file) {
            throw new Error(`File not found: ${upload.filename}`);
          }

          setProgress((prev) =>
            prev.map((p) =>
              p.filename === file.name
                ? { ...p, status: "uploading", progress: 0 }
                : p
            )
          );

          try {
            const uploadResponse = await fetch(upload.upload_url, {
              method: "PUT",
              body: file,
              headers: {
                "Content-Type": file.type || "application/octet-stream",
                "x-upsert": "true",
              },
            });

            if (!uploadResponse.ok) {
              throw new Error(`Upload failed for ${file.name}: ${uploadResponse.status}`);
            }

            setProgress((prev) => {
              const updated = prev.map((p) =>
                p.filename === file.name
                  ? { ...p, status: "completed" as const, progress: 100 }
                  : p
              );
              onProgress?.(updated);
              return updated;
            });

            console.log(`[Step 2/3] Uploaded: ${file.name}`);
          } catch (err) {
            setProgress((prev) => {
              const updated = prev.map((p) =>
                p.filename === file.name
                  ? { ...p, status: "error" as const }
                  : p
              );
              onProgress?.(updated);
              return updated;
            });
            throw err;
          }
        });

        await Promise.all(uploadPromises);
        console.log("[Step 2/3] All files uploaded successfully");

        // Step 3: Create analysis
        console.log("[Step 3/3] Creating analysis...");
        
        const createRequest: CreateAnalysisRequest = {
          document_paths: urlsData.document_uploads.map((u) => u.file_path),
          chat_type: chatType,
          parent_analysis_id: parentAnalysisId,
        };

        if (query) {
          createRequest.message = query;
        }

        const analysisResponse = await fetch("/api/single-analysis/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(createRequest),
        });

        if (!analysisResponse.ok) {
          const errorData = await analysisResponse.json().catch(() => ({}));
          throw new Error(errorData.error || `Analysis creation failed: ${analysisResponse.status}`);
        }

        const analysisData: SingleAnalysisResponse = await analysisResponse.json();
        console.log("[Step 3/3] Analysis created successfully:", analysisData.id);

        return analysisData;
      } catch (err) {
        console.error("Upload and analyze error:", err);
        setError(err as Error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    uploadAndAnalyze,
    loading,
    error,
    progress,
  };
}
