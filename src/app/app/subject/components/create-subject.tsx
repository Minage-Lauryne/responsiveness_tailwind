"use client";

import { LoadingButton } from "@/components/ui/button";
import { SimpleTextarea } from "@/components/ui/simple-textarea";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FileUploadDropzone } from "./file-upload-dropzone";
import { useSubject } from "./use-subject";
import { useCreateAnalysisFromWorkspaceFiles } from "@/hooks/use-create-analysis-from-workspace-files";
import { cn } from "@/lib/utils";

export function CreateSubject() {
  const { files, context, setContext, clear } = useSubject();

  // Clear stale uploads on mount only
  useEffect(() => {
    useSubject.getState().clearStaleUploads();
  }, []);

  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const mutation = api.subject.create.useMutation({
    onError: () => {
      setLoading(false);
      setLoadingMessage("");
      toast.error("Oops! Failed to create analysis. Please try again.");
    },
  });
  const { createAnalysis } = useCreateAnalysisFromWorkspaceFiles();
  const router = useRouter();

  const onSubmit = async () => {
    setLoading(true);

    try {
      let analysisId: string | undefined;

      if (hasReadyFiles) {
        setLoadingMessage(`Uploading ${successfulFiles.length} file${successfulFiles.length > 1 ? 's' : ''}...`);
        const analysis = await createAnalysis({
          fileIds: successfulFiles.map((file) => file.id),
          context: context || undefined,
          chatType: "ANALYSIS",
        });
        analysisId = analysis.id;
      }

      setLoadingMessage("Creating analysis...");
      const subject = await mutation.mutateAsync({
        context,
        files: successfulFiles.map((file) => file.id),
        djangoAnalysisId: analysisId,
        chatType: "ANALYSIS",
      });

      clear();

      router.push(`/app/subject/${subject.id}/analysis`);
    } catch (error) {
      setLoading(false);
      setLoadingMessage("");
      toast.error("Failed to create analysis. Please try again.");
      console.error("Analysis creation error:", error);
    }
  };

  const successfulFiles = files.filter((f) => f.status === "success");
  const hasReadyFiles = successfulFiles.length > 0;

  return (
    <div className="flex flex-col pb-8 pt-0">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-[38px] font-bold leading-[102%] tracking-normal text-espresso">
          Create Single Analysis
        </h1>
        <p className="text-[24px] font-normal leading-[122%] tracking-normal text-espresso">
          What are you analyzing today? Tie research to your work quickly by uploading sources and add context or ideas into the dialogue box.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void onSubmit();
        }}
        className="flex flex-col gap-6"
      >
        <div className="space-y-6 mb-5">
          <div className="flex items-center gap-2">
            <h2 className="text-[19px] font-bold tracking-wider text-espresso mr-2">
              Select Files for Analysis
            </h2>
            <button
              type="button"
              className="flex items-center gap-1 text-[8.79px] font-medium leading-[100%] tracking-[0.04em] text-creamerDark hover:text-espressoLight uppercase"
            >
              <svg className="h-[15.22px] w-[15.22px] text-creamerDark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16v-4m0-4h.01" />
              </svg>
              Learn More
            </button>
          </div>
          <p className="text-[19px] font-regular leading-[122%] text-espresso mb-5">
            It's recommended to add 2-5 sources to analyze, such as: Annual Reports, RFPs, Proposals, 990s / Financial Reports, Impact Reports, etc.
          </p>
        </div>

        <SimpleTextarea
          placeholder="Ask to find reports, enter nonprofit websites, add any additional context, or provide any other prompts that would help your research."
          value={context}
          onChange={(e) => setContext(e.target.value)}
          className="h-[158px]"
        />

        <div className="flex flex-col gap-2 mt-5">
          <FileUploadDropzone />
        </div>
      </form>

      <div className="flex flex-col items-end mt-48">
        {loading && loadingMessage && (
          <p className="text-sm text-muted-foreground animate-pulse mb-2 text-center w-[164px]">
            {loadingMessage}
          </p>
        )}
        <LoadingButton
          disabled={context === "" && !hasReadyFiles}
          isLoading={loading}
          onClick={onSubmit}
          className={cn(
            "rounded-[22px] w-[164px] h-[44px] text-[12.64px] font-bold uppercase tracking-[0.04em] transition-all duration-200",
            loading || (context === "" && !hasReadyFiles)
              ? "bg-gradient-creamer text-espresso cursor-not-allowed"
              : "bg-gradient-espresso text-white hover:bg-gradient-creamer hover:text-espresso active:bg-stone active:text-espresso",
            loading && "pointer-events-none"
          )}
        >
          Start Analysis
        </LoadingButton>
      </div>
    </div>
  );
}
