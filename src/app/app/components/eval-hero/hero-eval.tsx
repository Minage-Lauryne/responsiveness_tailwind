"use client";

import { api } from "@/trpc/react";
import Link from "next/link";
import { MessageInput } from "@/components/ui/message-input";
import { RecentEvaluations } from "./recent-evaluations";
import { SingleAnalysisIcon, ComparativeAnalysisIcon } from "@/components/ui/icons";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { ChatType } from "@prisma/client";

export function HeroEval() {
  const { data: subjects } = api.subject.list.useQuery({
    limit: 3,
  });

  const [inputState, setInputState] = useState<{
    message: string;
    files: { id: string; title: string; status: "uploading" | "success" | "error" }[];
    hasContent: boolean;
    triggerSubmit: (chatType: ChatType) => Promise<void>;
  } | null>(null);
  
  const [clickedPathway, setClickedPathway] = useState<string | null>(null);

  const handlePathwayClick = useCallback(async (pathway: string) => {
    setClickedPathway(pathway);
    
    if (pathway === "Review Proposals") {
      toast.info("Review Proposals is coming soon!", {
        onAutoClose: () => setClickedPathway(null),
      });
      return;
    }

    if (!inputState?.hasContent) {
      toast.error("Please provide context or add files to analyze", {
        onAutoClose: () => setClickedPathway(null),
      });
      return;
    }

    const chatTypeMap: Record<string, ChatType> = {
      "Landscape Analysis": ChatType.LANDSCAPE_ANALYSIS,
      "Financial Analysis": ChatType.FINANCIAL_ANALYSIS,
      "Bias Analysis": ChatType.BIAS,
      "Leadership Analysis": ChatType.LEADERSHIP_ANALYSIS,
      "Program Analysis": ChatType.PROGRAM_ANALYSIS,
    };

    const chatType = chatTypeMap[pathway] || ChatType.ANALYSIS;
    await inputState.triggerSubmit(chatType);
  }, [inputState]);

  return (
    <div className="bg-gray-50/30 px-8 pt-1 pb-8">
      <div className="mx-auto max-w-[1400px]">
        <MessageInput 
          placeholder="Ask anything..." 
          className="mb-6"
          onStateChange={setInputState}
        />

        <div className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-[11.31px] font-semibold uppercase tracking-wider text-[#A59B92] mr-2">
              ANALYSIS PATHWAYS
            </h2>
            <button 
              className="flex items-center gap-1 text-[8.79px] font-medium leading-[100%] tracking-[0.04em] text-creamerDark hover:text-espressoLight uppercase"
              aria-label="Learn more about analysis pathways"
            >
              <svg className="h-[15.22px] w-[15.22px] text-creamerDark" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16v-4m0-4h.01" />
              </svg>
              LEARN MORE
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              "Landscape Analysis",
              "Financial Analysis",
              "Bias Analysis",
              "Leadership Analysis",
              "Program Analysis",
              "Review Proposals",
            ].map((pathway) => (
              <button
                key={pathway}
                onClick={() => void handlePathwayClick(pathway)}
                className={`rounded-full border-[1.43px] px-6 py-3 text-[14.34px] font-medium italic leading-[122%] transition-colors ${
                  clickedPathway === pathway
                    ? "border-espresso bg-creamerLight text-espresso"
                    : "border-espresso bg-white text-espresso hover:bg-gray-50"
                }`}
              >
                {pathway}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-[11.31px] font-semibold uppercase tracking-wider text-[#A59B92] mr-2">
              COMPREHENSIVE ANALYSES
            </h2>
            <button 
              className="flex items-center gap-1 text-[8.79px] font-medium leading-[100%] tracking-[0.04em] text-creamerDark hover:text-espressoLight uppercase"
              aria-label="Learn more about comprehensive analyses"
            >
              <svg className="h-[15.22px] w-[15.22px] text-creamerDark" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16v-4m0-4h.01" />
              </svg>
              LEARN MORE
            </button>
          </div>
        </div>

        <div className="w-full">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-6">
              <div
                className="relative min-h-[228px] rounded-[11px] overflow-hidden transition-all duration-200 hover:shadow-xl
                           shadow-[0_3px_20px_-9px_rgba(0,0,0,0.35)]"
              >
                <div className="absolute inset-0 bg-blue-block" aria-hidden />
                <div className="absolute inset-0 bg-white/10 pointer-events-none" aria-hidden />
                <div
                  className="absolute left-0 top-0 w-1/2 h-1/2 pointer-events-none"
                  aria-hidden
                  style={{
                    background:
                      "radial-gradient(circle at 0% 0%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 40%, transparent 70%)",
                  }}
                />
                <div
                  className="absolute inset-0 bg-[url('/images/noise.png')] bg-repeat pointer-events-none opacity-[0.12] mix-blend-overlay"
                  aria-hidden
                />
                <div className="relative z-10 flex min-h-[228px] flex-col justify-between p-8 text-gray-900">
                  <div className="flex items-start gap-3">
                    <SingleAnalysisIcon className="h-7 w-7 text-espresso" />
                    <h3 className="text-[28.41px] font-semibold leading-[92.32%] text-espresso">
                      Single Analysis
                    </h3>
                  </div>
                  <p className="text-[20px] font-light leading-[30px] text-black">
                    Analyze a proposal, organization, strategic plan, etc.
                  </p>
                  <div className="flex justify-end">
                    <Link href="/app/subject">
                      <button className="rounded-[22px] bg-gradient-espresso px-6 py-2.5 text-sm font-medium uppercase text-white hover:bg-gradient-creamer hover:text-espresso active:bg-gradient-creamer active:text-espresso transition-all duration-200">
                        CREATE
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
              <div
                className="relative min-h-[228px] rounded-[11px] overflow-hidden transition-all duration-200 hover:shadow-xl
                           shadow-[0_3px_20px_-9px_rgba(0,0,0,0.35)]"
              >
                <div className="absolute inset-0 bg-blue-block" aria-hidden />
                <div className="absolute inset-0 bg-white/10 pointer-events-none" aria-hidden />
                <div
                  className="absolute left-0 top-0 w-1/2 h-1/2 pointer-events-none"
                  aria-hidden
                  style={{
                    background:
                      "radial-gradient(circle at 0% 0%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 40%, transparent 70%)",
                  }}
                />
                <div
                  className="absolute inset-0 bg-[url('/images/noise.png')] bg-repeat pointer-events-none opacity-[0.12] mix-blend-overlay"
                  aria-hidden
                />

                <div className="relative z-10 flex min-h-[228px] flex-col justify-between p-8">
                  <div className="flex items-start gap-3">
                    <ComparativeAnalysisIcon className="h-7 w-7 text-espresso" />
                    <h3 className="text-[28.41px] font-semibold leading-[92.32%] text-espresso">
                      Comparative Analysis
                    </h3>
                  </div>
                  <p className="text-[20px] font-light leading-[30px] text-black">
                    Compare multiple proposals, organizations, strategic plans, etc.
                  </p>
                  <div className="flex justify-end">
                    {/* <Link href="/app/comparative/create"> */}

                    <button className="rounded-[22px] bg-stone px-6 py-2.5 text-[12.64px] font-bold uppercase tracking-[0.04em] text-espresso">
                      COMING SOON
                    </button>
                    {/* </Link> */}

                  </div>
                </div>
              </div>
            </div>

            <div>
              <RecentEvaluations />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}