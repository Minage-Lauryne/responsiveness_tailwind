"use client";

import * as React from "react";
import { useCallback, useEffect, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Upload, X, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { api } from "@/trpc/react";
import { useProfile } from "./use-profile";
import { Button } from "@/components/ui/button";

interface LogoUploadDropzoneProps {
  organizationId?: string;
  onUploaded?: (publicUrl: string) => void;
  existingLogo?: string | null;
}

export default function LogoUploadDropzone({
  organizationId,
  onUploaded,
  existingLogo = null,
}: LogoUploadDropzoneProps) {
  const {
    logoFile,
    logoPreview,
    uploadedUrl,
    status,
    error,
    setLogoFile,
    setLogoPreview,
    setUploadedUrl,
    setUploadController,
    setStatus,
    setError,
    cancelUpload,
    clear,
  } = useProfile() as any; // runtime store, types above

  const getUploadUrl = api.files.getUploadUrl.useMutation();

  const MAX_BYTES = 5 * 1024 * 1024;
  const ACCEPTED = [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
    "image/svg+xml",
  ];

  useEffect(() => {
    if (!logoPreview && existingLogo) {
      setLogoPreview(existingLogo);
      setUploadedUrl(existingLogo);
    }
    return () => {
      try {
        if (logoPreview && logoPreview.startsWith("blob:")) {
          URL.revokeObjectURL(logoPreview);
        }
      } catch {}
      try {
        cancelUpload();
      } catch {}
    };
  }, [existingLogo]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const f = acceptedFiles[0];
      if (!f) return;

      if (!ACCEPTED.includes(f.type)) {
        toast.error("Please upload a PNG, JPEG, WebP, GIF or SVG image.");
        return;
      }
      if (f.size > MAX_BYTES) {
        toast.error("Image too large. Max size is 5MB.");
        return;
      }

      setLogoFile(f);

      const objectUrl = URL.createObjectURL(f);
      setLogoPreview(objectUrl);

      void startUpload(f);
    },
    [],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"],
    },
    maxSize: MAX_BYTES,
    onDropRejected: (rejected) => {
      rejected.forEach((r) => {
        if (r.file.size > MAX_BYTES) {
          toast.error(`File too large: ${r.file.name}`);
        } else {
          toast.error(`Invalid file: ${r.file.name}`);
        }
      });
    },
  });

  const startUpload = useCallback(
    async (file: File) => {
      setError(null);
      setStatus("uploading");
      const abortController = new AbortController();
      setUploadController(abortController);

      try {
        const uploadDataRaw = await getUploadUrl.mutateAsync({
          fileName: file.name,
          bucket: "media",
        });

        type UploadData = { signedUrl: string; token: string; path: string; publicUrl?: string };
        const uploadData = uploadDataRaw as unknown as UploadData;

        if (!uploadData || !uploadData.signedUrl) {
          throw new Error("No signed URL returned from server");
        }

        const builtPublicUrl =
          uploadData.publicUrl ??
          (process.env.NEXT_PUBLIC_SUPABASE_URL
            ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/${encodeURIComponent(
                "media",
              )}/${uploadData.path.split("/").map(encodeURIComponent).join("/")}`
            : undefined);

        if (!builtPublicUrl) {
          throw new Error("Cannot determine public URL for uploaded file");
        }

        const resp = await fetch(uploadData.signedUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type,
            "x-upsert": "true",
          },
          body: file,
          signal: abortController.signal,
        });

        if (!resp.ok) {
          throw new Error(`Upload failed: ${resp.status} ${resp.statusText}`);
        }

        setLogoPreview(builtPublicUrl);
        setUploadedUrl(builtPublicUrl);
        setStatus("success");
        setUploadController(null);
        setLogoFile(undefined);

        if (onUploaded) onUploaded(builtPublicUrl);
        toast.success("Logo successfully uploaded");
      } catch (err: any) {
        if (err.name === "AbortError") {
          setError("Upload cancelled");
          setStatus("error");
          toast.error("Upload cancelled");
          return;
        }
        console.error("Upload error:", err);
        setError(err.message ?? "Upload failed");
        setStatus("error");
        toast.error("Upload failed. Please try again.");
      } finally {
        setUploadController(null);
      }
    },
    [getUploadUrl, setLogoPreview, setStatus, setUploadController, setError, organizationId, onUploaded, setLogoFile, setUploadedUrl],
  );

  const handleRemove = useCallback(async () => {
    if (logoPreview && logoPreview.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(logoPreview);
      } catch {}
    }

    cancelUpload();
    setLogoPreview(null);
    setUploadedUrl(null);
    setStatus("idle");
    setError(null);
    setLogoFile(undefined);

    toast.success("Logo removed");
  }, [logoPreview, cancelUpload, setLogoPreview, setUploadedUrl, setStatus, setError, setLogoFile]);

  const statusElement = useMemo(() => {
    if (status === "uploading") {
      return (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          <span className="text-sm text-blue-600">Uploading...</span>
        </div>
      );
    }
    if (status === "error") {
      return (
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <span className="text-sm text-red-600">{error ?? "Upload failed"}</span>
        </div>
      );
    }
    if (status === "success") {
      return (
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-sm text-green-600">{uploadedUrl ? "Logo ready" : "Saved"}</span>
        </div>
      );
    }
    return null;
  }, [status, error, uploadedUrl]);

  return (
    <div className="w-full">
      <div className="flex items-start gap-4">
        <div
          {...getRootProps()}
          className={`cursor-pointer rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
            isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
          }`}
          style={{ width: 128, height: 128 }}
        >
          <input {...getInputProps()} />
          {logoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoPreview} alt="logo preview" className="object-contain w-full h-full" />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Upload className="mb-1" />
              <div className="text-xs">Drop logo or click</div>
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">{logoFile?.name ?? (logoPreview ? "Selected logo" : "No logo selected")}</div>
            <div>{statusElement}</div>
          </div>

          <div className="mt-3 flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (logoFile) void startUpload(logoFile);
                else toast("Drop a file to upload");
              }}
              disabled={status === "uploading"}
            >
              {status === "uploading" ? "Uploading..." : "Upload & Save"}
            </Button>

            <Button type="button" variant="ghost" onClick={handleRemove} disabled={status === "uploading"}>
              <X className="mr-2 h-4 w-4" />
              Remove
            </Button>
          </div>

          <div className="mt-3 text-xs text-gray-500">PNG, JPG, WebP, GIF or SVG. Max 5MB.</div>
        </div>
      </div>
    </div>
  );
}