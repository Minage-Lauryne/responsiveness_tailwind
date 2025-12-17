"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Plus, X, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { PaperclipIcon, SearchIcon } from "@/components/ui/icons";
import { api } from "@/trpc/react";
import { formatDistanceToNow } from "date-fns";
import { useSubject } from "@/app/app/subject/components/use-subject";
import { toast } from "sonner";

type Props = {
  className?: string;
  disabled?: boolean;
  externalFileInputRef?: React.RefObject<HTMLInputElement>;
};

export function AddFilesButton({ className = "", disabled, externalFileInputRef }: Props) {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const popupRef = useRef<HTMLDivElement | null>(null);
  const countButtonRef = useRef<HTMLButtonElement | null>(null);
  const internalFileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const countPopupRef = useRef<HTMLDivElement | null>(null);
  const [showCountPopup, setShowCountPopup] = useState(false);

  const { files, addUploadingFile, addSelectedFile, removeFile, updateFileProgress, updateFileStatus, setUploadController } = useSubject();
  const { data: workspaceFiles = [] } = api.files.list.useQuery();
  const getUploadUrlMutation = api.files.getUploadUrl.useMutation();
  const createDocumentMutation = api.files.createUserDocument.useMutation();

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      const clickedOutsideMain = popupRef.current && !popupRef.current.contains(target);
      const clickedOutsideCount = countPopupRef.current && !countPopupRef.current.contains(target) && !(countButtonRef.current && countButtonRef.current.contains(target));

      if ((open || searchOpen) && showCountPopup) {
        if (clickedOutsideMain && clickedOutsideCount) {
          setOpen(false);
          setSearchOpen(false);
          setShowCountPopup(false);
        }
        return;
      }

      if (open || searchOpen) {
        if (clickedOutsideMain) {
          setOpen(false);
          if (!searchValue) setSearchOpen(false);
        }
      }

      if (showCountPopup) {
        if (clickedOutsideCount) {
          setShowCountPopup(false);
        }
      }
    };

    if (open || searchOpen || showCountPopup) {
      document.addEventListener("mousedown", handleOutside);
      return () => document.removeEventListener("mousedown", handleOutside);
    }
  }, [open, searchOpen, searchValue, showCountPopup]);

  useEffect(() => {
    if ((searchOpen || searchValue) && scrollRef.current) {
      setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, 0);
    }
  }, [searchOpen, searchValue, files.length]);

  const uploadFile = useCallback(
    async (file: File) => {
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
        await createDocumentMutation.mutateAsync({ id: fileId, fileName: file.name, fileType: file.type, filePath: uploadData.path });

        updateFileStatus(fileId, "success");
      } catch (err) {
        console.error("Upload error:", err);
        updateFileStatus(fileId, "error", err instanceof Error ? err.message : "Upload failed");
        toast.error(`Failed to upload ${file.name}`);
      }
    },
    [addUploadingFile, createDocumentMutation, getUploadUrlMutation, setUploadController, updateFileProgress, updateFileStatus],
  );

  const uploadFiles = useCallback((files: File[]) => {
    files.forEach((f) => void uploadFile(f));
  }, [uploadFile]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setOpen(false);
    if (files.length > 0) uploadFiles(files);
    if (internalFileInputRef.current) internalFileInputRef.current.value = "";
  }, [uploadFiles]);

  const handleUploadClick = () => {
    if (disabled) return;
    if (externalFileInputRef && externalFileInputRef.current) {
      externalFileInputRef.current.click();
      setOpen(false);
      return;
    }
    internalFileInputRef.current?.click();
    setOpen(false);
  };

  const filtered = workspaceFiles.filter((file) => !files.some((f) => f.id === file.id) && (!searchValue || file.name.toLowerCase().includes(searchValue.toLowerCase())));
  const [pendingWorkspaceSelection, setPendingWorkspaceSelection] = useState<Record<string, string>>({});

  return (
    <div className={`flex items-center ${className}`}>
      <input ref={internalFileInputRef} type="file" onChange={onFileChange} accept="*/*" multiple className="hidden" />

      <button
        type="button"
        onClick={() => { setOpen((s) => !s); setSearchOpen(false); }}
        disabled={disabled}
        className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity"
      >
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-espresso">
          <Plus className="h-3 w-3 text-white" />
        </div>
        <span>Add files</span>
      </button>

      {files.length > 0 && (
        <div className="ml-2 relative">
          <button
            ref={countButtonRef}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowCountPopup((prev) => {
                const next = !prev;
                if (next) {
                  setOpen(false);
                  setSearchOpen(false);
                }
                return next;
              });
            }}
            className="flex items-center gap-2 rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
          >
            <FileText className="h-4 w-4" />
            <span className="whitespace-nowrap">{files.length} {files.length === 1 ? "file" : "files"}</span>
          </button>

          {showCountPopup && (
            <div ref={countPopupRef} className="absolute z-50 bottom-full mb-2 left-0 w-56 rounded-md bg-white border p-2 shadow">
              <div className="text-sm font-medium mb-2">Added Files</div>
              <div className="space-y-2">
                {files.map((f) => (
                  <div key={f.id} className="flex items-center gap-2 text-sm">
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}
                      className="text-xs text-muted-foreground mr-1"
                      aria-label={`Remove ${f.title}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="truncate">{f.title}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {open && (
        <div ref={popupRef} className="absolute z-50 bottom-full mb-2 w-[237px] rounded-[6px] bg-blue-50 border-gray-100 p-1 shadow">
          <button type="button" onClick={handleUploadClick} className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-black/5 transition-colors">
            <PaperclipIcon size={15} className="text-[#484139]" />
            <span className="text-[13.79px] font-medium text-[#484139]">Upload New Files</span>
          </button>

          <button type="button" onClick={() => { setSearchOpen(true); setOpen(true); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-black/5 transition-colors">
            <SearchIcon size={15} className="text-[#484139]" />
            <span className="text-[13.79px] font-medium text-[#484139]">Search Workspace Files</span>
          </button>
        </div>
      )}

      {(searchOpen || searchValue) && (
        <div
          ref={popupRef}
          className="absolute z-50 bottom-full mb-2 w-[520px] rounded-2xl shadow-lg border p-4"
          style={{
            background: "linear-gradient(180deg, #FBFAF9 0%, #EDE9E3 100%)",
          }}
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search the files already uploaded to your workspace"
                className="flex-1 rounded-full border border-[#E6E6E6] px-4 py-2 text-sm placeholder:text-muted-foreground outline-none bg-white"
              />
              <button
                type="button"
                onClick={() => {
                  Object.entries(pendingWorkspaceSelection).forEach(([id, name]) => {
                    addSelectedFile(id, name, "workspace");
                  });
                  setPendingWorkspaceSelection({});
                  setSearchValue("");
                  setSearchOpen(false);
                  setOpen(false);
                }}
                className="rounded-full bg-gradient-espresso px-3 py-1.5 text-xs font-semibold text-white"
              >
                ADD
              </button>
            </div>
            <div>
                <div
                  ref={scrollRef}
                  className="space-y-2 max-h-80 overflow-auto overflow-x-hidden pr-2 border rounded-md p-3"
                  style={{ scrollbarWidth: "thin" }}
                >
                  <div className="text-sm font-medium mb-2">Selected Files</div>
                  {files.length === 0 && Object.keys(pendingWorkspaceSelection).length === 0 && (
                    <div className="text-sm text-muted-foreground">No files selected</div>
                  )}
                  {files.map((sf) => (
                    <div key={sf.id} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-50 min-w-0">
                      {sf.status === "uploading" ? (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      ) : sf.status === "success" ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); removeFile(sf.id); }}
                          className="text-muted-foreground p-1 rounded hover:bg-gray-100"
                          aria-label={`Remove ${sf.title}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                      <div className="flex-1 truncate text-sm min-w-0 max-w-[240px]" title={sf.title}>{sf.title}</div>
                    </div>
                  ))}
                  {Object.keys(pendingWorkspaceSelection).map((id) => (
                    <div key={id} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm bg-green-50 min-w-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); setPendingWorkspaceSelection((prev) => { const copy = { ...prev }; delete copy[id]; return copy; }); }}
                        className="text-muted-foreground p-1 rounded hover:bg-gray-100"
                        aria-label={`Remove ${pendingWorkspaceSelection[id]}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <div className="flex-1 truncate text-sm min-w-0 max-w-[200px]" title={pendingWorkspaceSelection[id]}>{pendingWorkspaceSelection[id]}</div>
                    </div>
                  ))}
                <div className="mt-4">
                  <div className="text-sm font-medium mb-2">Workspace Files</div>
                  <div>
                    {filtered.length === 0 ? (
                      <div className="p-4 text-sm text-muted-foreground">No files found</div>
                    ) : (
                      filtered.map((file) => {
                        const isPending = !!pendingWorkspaceSelection[file.id];
                        return (
                          <div
                            key={file.id}
                            onClick={() => {
                              setPendingWorkspaceSelection((prev) => {
                                const copy = { ...prev };
                                if (copy[file.id]) {
                                  delete copy[file.id];
                                } else {
                                  copy[file.id] = file.name;
                                }
                                return copy;
                              });
                              setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, 0);
                            }}
                            className={`px-4 py-3 cursor-pointer border-b last:border-b-0 min-w-0 ${isPending ? 'bg-green-50' : 'hover:bg-gray-200'}`}
                          >
                            <div className="flex items-center justify-between min-w-0">
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <div className="text-sm truncate max-w-[200px]" title={file.name}>{file.name}</div>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {file.isUploadedByCurrentUser
                                  ? `uploaded ${formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}`
                                  : `uploaded by ${file.addedBy.firstName || "someone"}`}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddFilesButton;
