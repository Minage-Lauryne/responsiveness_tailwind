"use client";

import { createId } from "@paralleldrive/cuid2";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SubjectFile {
  id: string;
  title: string;
  status: "uploading" | "success" | "error";
  error?: string;
  file?: File; 
  group?: string;
  url?: string;
  uploadProgress?: string; 
}

interface SubjectState {
  files: SubjectFile[];
  context: string;
  uploadControllers: Map<string, AbortController>;
  setContext: (context: string) => void;
  addUploadingFile: (file: File, group?: string) => string;
  addSelectedFile: (fileId: string, fileName: string, group?: string) => void;
  updateFileStatus: (
    id: string,
    status: "success" | "error",
    error?: string,
  ) => void;
  updateFileProgress: (id: string, progress: string) => void;
  removeFile: (id: string) => void;
  setUploadController: (id: string, controller: AbortController) => void;
  removeUploadController: (id: string) => void;
  cancelUpload: (id: string) => void;
  clearStaleUploads: () => void;
  clear: () => void;
}

export const useSubject = create<SubjectState>()(
  persist(
    (set, get) => ({
      files: [],
      context: "",
      uploadControllers: new Map(),
      setContext: (context) => {
        set({ context });
      },
      addUploadingFile: (file, group) => {
        const id = createId();
        const newFile: SubjectFile = {
          id,
          title: file.name,
          status: "uploading",
          file,
          group,
        };
        set((state) => ({
          files: [...state.files, newFile],
        }));
        return id;
      },

      addSelectedFile: (fileId, fileName, group) => {
        const newFile: SubjectFile = {
          id: fileId,
          title: fileName,
          status: "success",
          group,
        };
        set((state) => ({
          files: [...state.files, newFile],
        }));
      },

      updateFileStatus: (id, status, error) => {
        set((state) => ({
          files: state.files.map((file) =>
            file.id === id
              ? {
                  ...file,
                  status,
                  error,

                  file: undefined,
                  uploadProgress: undefined,
                }
              : file,
          ),
        }));

        get().removeUploadController(id);
      },

      updateFileProgress: (id, progress) => {
        set((state) => ({
          files: state.files.map((file) =>
            file.id === id
              ? {
                  ...file,
                  uploadProgress: progress,
                }
              : file,
          ),
        }));
      },

      removeFile: (id) => {
        // Cancel upload if it's in progress
        get().cancelUpload(id);
        set((state) => ({
          files: state.files.filter((file) => file.id !== id),
        }));
      },

      setUploadController: (id, controller) => {
        set((state) => {
          const newControllers = new Map(state.uploadControllers);
          newControllers.set(id, controller);
          return { uploadControllers: newControllers };
        });
      },

      removeUploadController: (id) => {
        set((state) => {
          const newControllers = new Map(state.uploadControllers);
          newControllers.delete(id);
          return { uploadControllers: newControllers };
        });
      },

      cancelUpload: (id) => {
        const { uploadControllers } = get();
        const controller = uploadControllers.get(id);
        if (controller) {
          controller.abort();
          get().removeUploadController(id);
        }
      },

      clearStaleUploads: () => {
        set((state) => ({
          // Remove any files that aren't successful (uploading or error states)
          files: state.files.filter((file) => file.status === "success"),
        }));
      },

      clear: () => {
        // Cancel all ongoing uploads
        const { uploadControllers } = get();
        uploadControllers.forEach((controller) => {
          controller.abort();
        });
        set({ files: [], context: "", uploadControllers: new Map() });
      },
    }),
    {
      name: "subject-storage-3",
      partialize: (state) => ({

        files: state.files.map(({ file: _file, ...rest }) => rest),
        context: state.context,
      }),
    },
  ),
);
