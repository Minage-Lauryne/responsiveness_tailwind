"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSubject } from "../../../subject/components/use-subject";
import { TbReplace } from "react-icons/tb";
import { BsLayoutSidebar } from "react-icons/bs";
import { FileText, Plus, Check, Building2 } from "lucide-react";
import { ComparativeFileUploadDropzone } from "../../../subject/components-comparative/analysis-file-upload-dropzone";
import { RxCross2 } from "react-icons/rx";
import type { AnalysisData, Proposal } from "../types";
import { formatTimeline } from "@/lib/analyze";

interface SidepanelProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  analysisData: AnalysisData | null;
  loading: boolean;
}

function Badge({ text }: { text: string }) {
  return <span className="text-xs bg-slate-800/30 px-2 py-1 rounded text-slate-100">{text}</span>;
}

function SkeletonLine({ width = "w-24" }: { width?: string }) {
  return <div className={`bg-slate-200 animate-pulse h-3 rounded ${width}`} />;
}

function ProposalCard({
  proposal,
  onRemove,
  disabled,
}: {
  proposal: Partial<Proposal>;
  onRemove: (filename?: string) => void;
  disabled: boolean;
}) {
  const rawOrgFromVerification = (proposal as any)?.verification?.org_name;
  const rawOrg = rawOrgFromVerification || proposal.organization_name || "";
  const cleanedOrg = rawOrg ? rawOrg.replace(/\.pdf$/i, "").trim() : "";
  const displayName = cleanedOrg || (proposal.filename || "Uploaded file");
  const initials = displayName
    ? displayName.split(" ").slice(0, 2).map((s: string) => s[0]?.toUpperCase()).join("")
    : "";

  return (
    <div className="relative rounded-lg bg-white px-4 py-3 ring-1 ring-border hover:shadow-sm flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <FileText className="h-5 w-5 flex-shrink-0 text-slate-600" />
        <div className="min-w-0">
          <div className="font-medium text-sm truncate">{proposal.filename || "Uploaded file"}</div>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground min-w-0">
            <div className="flex items-center justify-center h-4 w-4 flex-shrink-0">
              {cleanedOrg ? (
                <Building2 className="h-4 w-4 text-gray-400" />
              ) : (
                <div className="h-4 w-4 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-500">
                  {initials || ""}
                </div>
              )}
            </div>
            <div className="truncate">
              {cleanedOrg ? (
                <span>{cleanedOrg}</span>
              ) : (
                <span className="inline-block align-middle">
                  <div className="bg-slate-200 animate-pulse h-3 rounded w-28 inline-block" />
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="ml-3 flex items-center gap-2">
        <button
          onClick={() => {
            if (!disabled) onRemove(proposal.filename);
          }}
          aria-label={`Remove ${proposal.filename ?? "proposal"}`}
          title="Remove proposal"
          disabled={disabled}
          className="p-1 rounded hover:bg-slate-100 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RxCross2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function Sidepanel({ collapsed, setCollapsed, analysisData, loading }: SidepanelProps) {
  const { files } = useSubject();

  const [disableActions, setDisableActions] = useState(true); 

  const [showRfpDropzone, setShowRfpDropzone] = useState(false);
  const [showDropzone, setShowDropzone] = useState(false);

  const uploadedRfp = useMemo(
    () => files.find((f) => f.group === "rfp" && f.status === "success") ?? null,
    [files]
  );
  const uploadedProposalFiles = useMemo(
    () => files.filter((f) => f.group === "proposal" && f.status === "success"),
    [files]
  );

  const prevProposalCountRef = useRef<number>(uploadedProposalFiles.length);
  useEffect(() => {
    if (showDropzone && uploadedProposalFiles.length > prevProposalCountRef.current) {
      setShowDropzone(false);
    }
    prevProposalCountRef.current = uploadedProposalFiles.length;
  }, [uploadedProposalFiles.length, showDropzone]);

  const usingSampleFallback = !analysisData && !loading && uploadedProposalFiles.length === 0;
  const usingUploadedFiles = !analysisData && uploadedProposalFiles.length > 0;
  const anlysisTitle = analysisData?.rfp_title || uploadedRfp?.title;

  let displayProposals: Partial<Proposal>[] = [];

  if (analysisData && Array.isArray(analysisData.proposals)) {
    displayProposals = analysisData.proposals;
  } else if (usingUploadedFiles) {
    displayProposals = uploadedProposalFiles.map((f) => {
      const filename =
        (f as any).filename ||
        (f as any).name ||
        (f as any).title ||
        (f as any).file?.name ||
        "Uploaded file";
      return {
        filename,
        organization_name: "",
        recommendation: undefined,
      } as Partial<Proposal>;
    });
  }

  const rfpSummary = analysisData?.rfp_summary;

  const [removedFilenames, setRemovedFilenames] = useState<string[]>([]);

  const prevUploadedRfpRef = useRef<string | null>(null);

  function getSubjectFileId(f: any): string | null {
    if (!f) return null;
    return (f.filename ?? f.name ?? f.title ?? f.id ?? f.file?.name ?? null) as string | null;
  }

  useEffect(() => {
    prevUploadedRfpRef.current = getSubjectFileId(uploadedRfp);
  }, []);

  useEffect(() => {
    const currentId = getSubjectFileId(uploadedRfp);
    const prevId = prevUploadedRfpRef.current;
    if (prevId !== null && currentId !== prevId) {
      console.warn("RFP replaced, re-analysis is currently disabled.");
    }
    prevUploadedRfpRef.current = currentId;
  }, [uploadedRfp]);

  const handleRemoveProposal = async (filename?: string) => {
    if (disableActions) return;

    if (!filename) {
      if (!confirm("Remove this proposal?")) return;
    } else {
      if (!confirm(`Remove proposal "${filename}"? This will re-run analysis after removal.`)) return;
    }

    if (filename) setRemovedFilenames((prev) => [...prev, filename]);

    const serverFilenames = uploadedProposalFiles
      .map((f) => getSubjectFileId(f))
      .filter(Boolean) as string[];
    const fallbackFilenames = displayProposals.map((p) => p.filename).filter(Boolean) as string[];

    const baselineFilenames = serverFilenames.length > 0 ? serverFilenames : fallbackFilenames;
    const kept = baselineFilenames.filter((f) => f && f !== filename);

    console.warn("Re-analysis disabled. Intended kept filenames:", kept);
  };

  const filteredDisplayProposals = displayProposals.filter((p) => {
    if (!p.filename) return true;
    return !removedFilenames.includes(p.filename);
  });
  const rfpTimelineObj = formatTimeline(rfpSummary?.timeline_expectations);

  return (
    <aside
      aria-label="RFP sidepanel"
      className={`transition-all duration-200 border-r bg-gradient-to-b from-slate-50 to-white overflow-hidden ${
        collapsed ? "w-16 overflow-hidden" : "w-96 overflow-hidden"
      } sticky top-0 self-start h-screen overflow-hidden`}
    >
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <button
            aria-label={collapsed ? "Expand panel" : "Collapse panel"}
            onClick={() => setCollapsed(!collapsed)}
            className="rounded p-1 hover:bg-slate-180"
            title={collapsed ? "Expand" : "Collapse"}
          >
            <BsLayoutSidebar className="h-3.5 w-3.5 text-gray-600" />
          </button>
        </div>

        <div className="p-3 overflow-hidden flex-1">
          {!collapsed ? (
            <>
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm text-gray-600">RFP Document (Optional)</div>
                {rfpSummary || uploadedRfp ? (
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100/60 px-3 py-1 text-sm">
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/50">
                      <Check className="h-2.5 w-2.5 text-primary-foreground" />
                    </div>
                    <span className="text-slate-700">Uploaded</span>
                  </div>
                ) : null}
              </div>

              <div className="mb-6">
                {rfpSummary || uploadedRfp ? (
                  <div className="rounded-lg bg-slate-900 text-white p-4 shadow-lg">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 flex-shrink-0 text-white" />
                          <div className="text-lg font-semibold truncate">{anlysisTitle}</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <button
                          onClick={() => {
                            if (!disableActions) setShowRfpDropzone((prev) => !prev);
                          }}
                          title="Replace RFP"
                          className="text-white hover:text-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Replace RFP document"
                          disabled={disableActions}
                        >
                          <TbReplace className="h-6 w-6" />
                        </button>
                      </div>
                    </div>

                    {rfpSummary ? (
                      <>
                        <div className="mt-4 grid grid-cols-2 gap-4 text-xs text-slate-300">
                          <div>
                            <div className="text-xs">Budget</div>
                            <div className="mt-1 font-medium">{rfpSummary.budget_range}</div>
                          </div>
                          <div>
                            <div className="text-xs">Timeline</div>
                            <div className="mt-1 font-medium" title={rfpTimelineObj.full}>
                              {rfpTimelineObj.short}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {rfpSummary.key_requirements?.slice(0, 4).map((req, i) => (
                            <Badge key={i} text={req} />
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="mt-4">
                        <SkeletonLine width="w-48" />
                        <div className="mt-3 flex gap-2">
                          <SkeletonLine width="w-20" />
                          <SkeletonLine width="w-20" />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No RFP uploaded (optional)</div>
                )}

                {showRfpDropzone && (
                  <div className="mt-4">
                    <ComparativeFileUploadDropzone group="rfp" />
                    <div className="mt-2 text-xs text-muted-foreground">Replace the current RFP document.</div>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium">Proposals ({filteredDisplayProposals.length}/15)</div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (!disableActions) setShowDropzone((s) => !s);
                      }}
                      title="Add proposals"
                      className="inline-flex items-center gap-2 rounded px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={disableActions}
                    >
                      <Plus className="h-4 w-4" />
                      <span className="text-sm">Add</span>
                    </button>
                  </div>
                </div>

                {showDropzone && (
                  <div className="mb-3">
                    <ComparativeFileUploadDropzone group="proposal" multiple />
                    <div className="mt-2 text-xs text-muted-foreground">
                      Drop files here or click to browse. After upload the list will update automatically.
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {loading ? (
                    <div className="text-sm text-gray-500">Loading proposals...</div>
                  ) : filteredDisplayProposals.length === 0 ? (
                    <div className="text-sm text-gray-500">No proposals analyzed yet</div>
                  ) : (
                    filteredDisplayProposals.map((p, idx) => (
                      <ProposalCard
                        key={(p.filename ?? `proposal-${idx}`).toString()}
                        proposal={p}
                        onRemove={handleRemoveProposal}
                        disabled={disableActions}
                      />
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center space-y-3 py-4">
              <div className="text-xs text-gray-600">RFP</div>
              <div className="w-8 h-20 rounded bg-slate-900 flex">
                <FileText className="h-5 w-5 m-1.5 text-white" />
              </div>
              <div className="mt-4 text-xs text-gray-600">Proposals</div>
              <div className="flex flex-col items-center space-y-2 mt-2">
                {filteredDisplayProposals.map((p, i) => (
                  <div
                    key={(p.filename ?? i).toString()}
                    className="w-8 h-8 rounded border bg-white flex items-center justify-center text-xs"
                  >
                    {(p.filename && p.filename.charAt(0).toUpperCase()) || "P"}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
