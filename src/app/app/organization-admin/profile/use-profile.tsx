"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UploadStatus = "idle" | "uploading" | "success" | "error";

interface ProfileState {
  logoFile?: File | null;

  logoPreview?: string | null;

  uploadedUrl?: string | null;

  status: UploadStatus;
  error?: string | null;

  uploadController?: AbortController | null;

  setLogoFile: (file?: File | null) => void;
  setLogoPreview: (preview: string | null) => void;
  setUploadedUrl: (url: string | null) => void;
  setStatus: (s: UploadStatus) => void;
  setError: (msg?: string | null) => void;
  setUploadController: (c?: AbortController | null) => void;

  cancelUpload: () => void;

  clear: () => void;
}

export const useProfile = create<ProfileState>()(
  persist(
    (set, get) => ({
      logoFile: undefined,
      logoPreview: null,
      uploadedUrl: undefined,
      status: "idle",
      error: null,
      uploadController: null,

      setLogoFile: (file) => {
        set(() => ({ logoFile: file }));
      },

      setLogoPreview: (preview) => {
        set(() => ({ logoPreview: preview }));
      },

      setUploadedUrl: (url) => {
        set(() => ({ uploadedUrl: url }));
      },

      setStatus: (s) => {
        set(() => ({ status: s }));
      },

      setError: (msg) => {
        set(() => ({ error: msg ?? null }));
      },

      setUploadController: (c) => {
        set(() => ({ uploadController: c ?? null }));
      },

      cancelUpload: () => {
        const controller = get().uploadController;
        if (controller) {
          try {
            controller.abort();
          } catch {}
          set(() => ({ uploadController: null }));
        }
        set(() => ({ status: "idle" }));
      },

      clear: () => {
        const preview = get().logoPreview;
        if (preview && preview.startsWith("blob:")) {
          try {
            URL.revokeObjectURL(preview);
          } catch {}
        }
        set(() => ({
          logoFile: undefined,
          logoPreview: null,
          uploadedUrl: undefined,
          status: "idle",
          error: null,
          uploadController: null,
        }));
      },
    }),
    {
      name: "profile-storage",
      partialize: (state) => ({
        logoPreview: state.logoPreview,
        uploadedUrl: state.uploadedUrl,
        status: state.status,
        error: state.error,
      }),
    },
  ),
);