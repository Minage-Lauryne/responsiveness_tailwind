"use client";

import * as React from "react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Upload, Loader2, X } from "lucide-react";
import { api } from "@/trpc/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface ProfilePictureUploadProps {
  currentImage?: string | null;
  userName?: string | null;
  onUploaded?: () => void;
}

export function ProfilePictureUpload({
  currentImage,
  userName,
  onUploaded,
}: ProfilePictureUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [isUploading, setIsUploading] = useState(false);

  const getUploadUrl = api.files.getUploadUrl.useMutation();
  const updateUserImage = api.me.updateUserImage.useMutation();
  const utils = api.useUtils();

  const MAX_BYTES = 5 * 1024 * 1024;
  const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"];

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (!ACCEPTED.includes(file.type)) {
        toast.error("Please upload a PNG, JPEG, WebP, GIF or SVG image.");
        return;
      }
      if (file.size > MAX_BYTES) {
        toast.error("Image too large. Max size is 5MB.");
        return;
      }

      setIsUploading(true);

      try {
        const uploadData = await getUploadUrl.mutateAsync({
          fileName: file.name,
          bucket: "media",
        });

        if (!uploadData || !uploadData.signedUrl) {
          throw new Error("No signed URL returned from server");
        }

        const publicUrl =
          uploadData.publicUrl ??
          `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "")}/storage/v1/object/public/media/${uploadData.path}`;

        const resp = await fetch(uploadData.signedUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type,
            "x-upsert": "true",
          },
          body: file,
        });

        if (!resp.ok) {
          throw new Error(`Upload failed: ${resp.status} ${resp.statusText}`);
        }

        await updateUserImage.mutateAsync({ image: publicUrl });
        await utils.me.get.invalidate();

        setPreview(publicUrl);
        toast.success("Profile picture updated successfully");
        
        if (onUploaded) onUploaded();
      } catch (error: any) {
        console.error("Upload error:", error);
        toast.error("Upload failed. Please try again.");
      } finally {
        setIsUploading(false);
      }
    },
    [getUploadUrl, updateUserImage, utils, onUploaded]
  );

  const handleRemove = useCallback(async () => {
    setIsUploading(true);
    try {
      await updateUserImage.mutateAsync({ image: null });
      await utils.me.get.invalidate();
      
      setPreview(null);
      toast.success("Profile picture removed");
      
      if (onUploaded) onUploaded();
    } catch (error: any) {
      console.error("Remove error:", error);
      toast.error("Failed to remove profile picture.");
    } finally {
      setIsUploading(false);
    }
  }, [updateUserImage, utils, onUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"],
    },
    maxSize: MAX_BYTES,
    disabled: isUploading,
  });

  const getInitials = () => {
    if (!userName) return "U";
    return userName
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex items-start gap-4">
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-lg border-2 border-dashed transition-colors ${
          isDragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        } ${isUploading ? "pointer-events-none opacity-50" : ""}`}
        style={{ width: 128, height: 128 }}
      >
        <input {...getInputProps()} />
        {preview ? (
          <div className="relative h-full w-full p-2">
            <Avatar className="h-full w-full">
              <AvatarImage src={preview} alt={userName || "Profile"} className="object-cover" />
              <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
            </Avatar>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-gray-400">
            {isUploading ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                <p className="text-xs text-blue-600">Uploading...</p>
              </>
            ) : (
              <>
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-xl">{getInitials()}</AvatarFallback>
                </Avatar>
                <Upload className="h-5 w-5" />
                <p className="text-xs text-center">Click to upload</p>
              </>
            )}
          </div>
        )}
      </div>
      
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-700">
          {preview ? "Profile picture uploaded" : "No profile picture"}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          PNG, JPG, WebP, GIF or SVG. Max 5MB.
        </p>
        
        {preview && (
          <div className="mt-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={isUploading}
            >
              <X className="mr-2 h-4 w-4" />
              Remove Picture
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}