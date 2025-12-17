"use client";

import { authClient } from "@/lib/auth-client";
import { LogoSecondary } from "@/components/logo-secondary";
import { LoadingButton } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { useState, useMemo, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { ComparativeFileUploadDropzone } from "./analysis-file-upload-dropzone";
import { useAnalyze } from "@/hooks/use-analysis";
import { ComplereLogoLoading } from "@/components/complere-logo-loading";
import { LoadingCardSpinner } from "@/features/shared/loading-spinner";

export function CreateComparativeSubject() {
  const { uploadFiles, loading: analysisLoading, progress, submissionId } = useAnalyze();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [context, setContext] = useState("");
  const [rfpFile, setRfpFile] = useState<File | null>(null);
  const [proposalFiles, setProposalFiles] = useState<File[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentLoadingMessageIndex, setCurrentLoadingMessageIndex] = useState(0);

  const loadingMessages = [
    "Reviewing each proposal carefully",
    "Checking key differences",
    "Evaluating feasibility",
    "Highlighting contrasts",
    "Analyzing data",
    "Preparing your results",
    "Almost there"
  ];

  const { data } = api.me.get.useQuery();

  useEffect(() => {
    if (loading || analysisLoading) {
      const interval = setInterval(() => {
        setCurrentLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 8000); 

      return () => clearInterval(interval);
    } else {
      setCurrentLoadingMessageIndex(0);
    }
  }, [loading, analysisLoading, loadingMessages.length]);

  useEffect(() => {
    let mounted = true;
    const checkAuth = async () => {
      try {
        const session = await authClient.getSession();
        if (!mounted) return;
        if (session?.data?.session) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          router.push("/signin");
        }
      } catch (error) {
        if (!mounted) return;
        setIsAuthenticated(false);
        router.push("/signin");
      }
    };

    void checkAuth();
    return () => {
      mounted = false;
    };
  }, [router]);

  const handleRfpFilesChange = useCallback((files?: File[]) => {
    setRfpFile(files?.[0] ?? null);
  }, []);

  const handleProposalFilesChange = useCallback((files: File[] = []) => {
    setProposalFiles(files);
  }, []);

  const canCreate = useMemo(() => {
    return proposalFiles.length > 0;
  }, [proposalFiles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isAuthenticated === false) {
      router.push("/signin");
      return;
    }

    if (proposalFiles.length === 0) {
      toast.error("Please upload at least one proposal");
      return;
    }

    setLoading(true);

    try {
      const session = await authClient.getSession();
      if (!session?.data?.session) {
        toast.error("Your session has expired. Please log in again.");
        setLoading(false);
        router.push("/signin");
        return;
      }

      const formData = new FormData();
      if (rfpFile) {
        formData.append("rfp", rfpFile);
      }

      proposalFiles.forEach((file) => formData.append("proposals", file));

      // RFP context is optional and additive - used for funder alignment
      if (context.trim()) {
        formData.append("context", context.trim());
      }

      const result = await uploadFiles(formData) as { rfp_id?: string; id?: string } | undefined;

      toast.success("Analysis completed successfully!");

      const submissionId = result?.rfp_id || result?.id;
      if (submissionId) {
        // Analysis is complete, redirect to view it
        router.push(`/app/comparative/analysis/${submissionId}`);
      } else {
        router.push("/app/subject/list");
      }
    } catch (error) {
      console.error("Upload error:", error);
      if ((error as Error).message?.includes("401") || (error as Error).message?.includes("Authentication")) {
        router.push("/signin");
      } else {
        toast.error((error as Error).message || "Failed to start analysis");
      }
      setLoading(false);
    }
  };

  if (isAuthenticated === null) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/20 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-3">
          <ComplereLogoLoading />
          <div className="text-sm font-medium text-gray-600">Just a moment...</div>
        </div>
      </div>
    );
  }

  if (loading || analysisLoading) {
    return (
      <div className="flex-col text-lg">
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/20 backdrop-blur-sm">
          <LoadingCardSpinner />
          <div className="flex flex-col items-center gap-3 py-2 max-w-xl text-center">
            {progress ? (
              <>
                <div className="font-medium text-lg">{progress}</div>
                {submissionId && (
                  <div className="text-sm text-gray-600">
                    <div>Submission ID: <span className="font-mono">{submissionId}</span></div>
                    <div className="mt-2 text-xs">
                      You can safely navigate away and return to check the status later.
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-1">
                <div className="font-medium">{loadingMessages[currentLoadingMessageIndex]}</div>
                <div className="flex">
                  <span className="animate-bounce">.</span>
                  <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-8 pb-8 pt-0">
      <div className="flex flex-col justify-center gap-4">
        <LogoSecondary />
        <div className="flex flex-col">
          <div className="text-2xl font-medium text-black">
            Hi, {data?.firstName}. Let's get started.
          </div>
          <div className="text-1xl text-slate-500">
            Compare programs against research evidence. Upload proposals to evaluate program delivery models, financial viability, and leadership capacity using our database of 3,000+ research studies. This AI tool is currently in beta, and we welcome your feedback as we work to enhance the experience.
          </div>
        </div>
      </div>

      <div className="mb-8 space-y-6 pr-4">
        <div className="space-y-0">
          <div className="text-lg font-medium text-black">Start with a file:</div>

          <div className="space-y-0 divide-y divide-gray-100">
            <div className="flex items-start gap-3 py-3 bg-none rounded-md">
              <label className="flex items-start gap-3 w-full cursor-pointer" onClick={(e) => e.preventDefault()}>
                <input type="checkbox" className="sr-only" checked aria-label="RFPs" readOnly />
                <div
                  aria-hidden
                  className="h-8 w-8 flex-shrink-0 rounded flex items-center justify-center border bg-gray-300 border-gray-300"
                >
                  <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-black">RFP (Optional)</div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    Optionally upload an RFP to align analysis with funder priorities. The analysis will focus on evidence-based evaluation regardless of RFP content.
                  </div>
                </div>
              </label>
            </div>

            <div className="flex items-start gap-3 py-3 bg-none rounded-md">
              <label className="flex items-start gap-3 w-full cursor-pointer" onClick={(e) => e.preventDefault()}>
                <input type="checkbox" className="sr-only" checked aria-label="Proposals" readOnly />
                <div
                  aria-hidden
                  className="h-8 w-8 flex-shrink-0 rounded flex items-center justify-center border bg-gray-300 border-gray-300"
                >
                  <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-black">Proposals (Required)</div>
                  <div className="mt-0.5 text-xs text-slate-500">Upload program proposals to compare against research evidence. Each will be evaluated on delivery models, financial viability, and leadership capacity.</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="m-1 flex flex-col gap-6">
            <div>
              <div className="mb-2 text-sm font-semibold">Upload an RFP document (Optional)</div>
              <div className="text-xs py-2 px-3 text-slate-700 bg-blue-50 border border-blue-100 rounded mb-3">
                <strong>Optional:</strong> Upload an RFP to align the analysis with your funder priorities. The analysis will evaluate programs against research evidence regardless of RFP content. You can also use this tool to evaluate RFPs themselves against evidence-based best practices.
              </div>
              <ComparativeFileUploadDropzone
                group="rfp"
                label="Drop your RFP file here, or click to browse"
                onFilesChange={handleRfpFilesChange}
              />
            </div>
            <div>
              <div className="mb-2 text-sm font-semibold">Additional Context (Optional)</div>
              <div className="text-xs py-2 px-3 text-slate-700 bg-blue-50 border border-blue-100 rounded mb-3">
                <strong>Optional:</strong> Add any additional context, priorities, or specific areas you'd like the analysis to emphasize. The analysis will automatically evaluate programs against evidence-based best practices.
              </div>
              <Textarea
                placeholder="Add any additional context or priorities (optional)"
                value={context}
                onChange={(e) => {
                  const instructions = e.target.value;
                  setContext(instructions);
                }}
                className="min-h-24"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold">Upload proposal documents</div>
                <div className="text-xs text-gray-500">{proposalFiles.length}/15 proposals</div>
              </div>

              <ComparativeFileUploadDropzone
                group="proposal"
                multiple
                label="Drop proposal files here, or click to browse"
                onFilesChange={handleProposalFilesChange}
              />
            </div>
          </div>

          <div className="flex justify-center">
            <LoadingButton
              type="submit"
              disabled={!canCreate}
              effect="expandIcon"
              size="lg"
              iconPlacement="right"
              icon={SendHorizontal}
              isLoading={loading || analysisLoading}
            >
              Create Analysis
            </LoadingButton>
          </div>
        </form>
      </div>
    </div>
  );
}