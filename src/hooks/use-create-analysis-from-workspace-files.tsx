"use client";

import { useCallback, useState } from "react";
import type { SingleAnalysisResponse } from "@/types/single-analysis";

interface CreateAnalysisFromWorkspaceFilesOptions {
  fileIds: string[];
  context?: string;
  chatType?: string;
}


export function useCreateAnalysisFromWorkspaceFiles() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createAnalysis = useCallback(
    async ({
      fileIds,
      context,
      chatType = "ANALYSIS",
    }: CreateAnalysisFromWorkspaceFilesOptions): Promise<SingleAnalysisResponse> => {
      setLoading(true);
      setError(null);

      try {
        // Step 1: Get file metadata and download URLs from our database
        const filesResponse = await fetch("/api/workspace-files/get-files", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ fileIds }),
        });

        if (!filesResponse.ok) {
          throw new Error("Failed to get file metadata");
        }

        const { files } = (await filesResponse.json()) as {
          files: Array<{ id: string; name: string; downloadUrl: string }>;
        };

        // Step 2: Generate upload URLs from Django for each file
        const generateUrlsResponse = await fetch(
          "/api/single-analysis/generate-upload-urls",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              filenames: files.map((f) => f.name),
              chat_type: chatType,
            }),
          }
        );

        if (!generateUrlsResponse.ok) {
          throw new Error("Failed to generate upload URLs");
        }

        const { document_uploads } = (await generateUrlsResponse.json()) as {
          document_uploads: Array<{
            upload_url: string;
            file_path: string;
            filename: string;
          }>;
        };

        // Step 3: Download files from Supabase and upload to Django's storage
        const uploadPromises = files.map(async (file, index) => {
          const uploadInfo = document_uploads[index];
          if (!uploadInfo) {
            throw new Error(`No upload info for file: ${file.name}`);
          }

          // Download file from our Supabase storage
          const downloadResponse = await fetch(file.downloadUrl);
          if (!downloadResponse.ok) {
            throw new Error(`Failed to download file: ${file.name}`);
          }

          const fileBlob = await downloadResponse.blob();

          // Upload to Django's Supabase storage
          const uploadResponse = await fetch(uploadInfo.upload_url, {
            method: "PUT",
            headers: {
              "Content-Type":
                fileBlob.type || "application/octet-stream",
            },
            body: fileBlob,
          });

          if (!uploadResponse.ok) {
            throw new Error(`Failed to upload file: ${file.name}`);
          }

          return uploadInfo.file_path;
        });

        const uploadedPaths = await Promise.all(uploadPromises);

        // Step 4: Create analysis in Django using the uploaded file paths
        const analysisResponse = await fetch("/api/single-analysis/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            document_paths: uploadedPaths,
            message: context || undefined,
            chat_type: chatType,
          }),
        });

        if (!analysisResponse.ok) {
          const errorData = (await analysisResponse.json()) as { error: string };
          throw new Error(errorData.error || `HTTP ${analysisResponse.status}`);
        }

        const analysis = (await analysisResponse.json()) as SingleAnalysisResponse;
        return analysis;
      } catch (err) {
        const error = err as Error;
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { createAnalysis, loading, error };
}
