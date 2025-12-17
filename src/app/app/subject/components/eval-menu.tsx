"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { SubjectWithChat } from "../types";
import { cn } from "@/lib/utils";

export function EvalMenu({ evaluation }: { evaluation?: SubjectWithChat }) {
  const pathname = usePathname();

  const isComplete = (
    chatType: "ANALYSIS" | "FINANCIAL_ANALYSIS" | "LANDSCAPE_ANALYSIS" | "BIAS" | "LEADERSHIP_ANALYSIS" | "PROGRAM_ANALYSIS",
  ) => {
    const hasMessages = evaluation?.chats?.some(
      (chat) => chat.type === chatType && chat._count.messages > 0,
    ) ?? false;

    const hasDjangoAnalysis = (() => {
      if (!evaluation?.djangoAnalysisIds) return false;
      try {
        const analysisIds = evaluation.djangoAnalysisIds as Record<string, string>;
        return !!analysisIds[chatType];
      } catch {
        return false;
      }
    })();

    return hasMessages || hasDjangoAnalysis;
  };

  const allAnalysisItems = [
    {
      href: `/app/subject/${evaluation?.id}/analysis`,
      iconPath: "/icons/summary-analysis.svg",
      title: "Summary\nAnalysis",
      description: "Review the primary analysis results and insights",
      isActive: pathname.includes("/analysis") && !pathname.includes("/landscape") && !pathname.includes("/counterpoint"),
      isComplete: isComplete("ANALYSIS"),
      chatType: "ANALYSIS" as const,
    },
    {
      href: `/app/subject/${evaluation?.id}/landscape`,
      iconPath: "/icons/landscape-analysis.svg",
      title: "Landscape\nAnalysis",
      description: "Maps ecosystem of comparable programs and organizations to identify gaps, overlaps, and positioning opportunities.",
      isActive: pathname.includes("/landscape"),
      isComplete: isComplete("LANDSCAPE_ANALYSIS"),
      chatType: "LANDSCAPE_ANALYSIS" as const,
    },
    {
      href: `/app/subject/${evaluation?.id}/counterpoint`,
      iconPath: "/icons/financial-analysis.svg",
      title: "Financial\nAnalysis",
      description: "Review financial metrics and insights",
      isActive: pathname.includes("/counterpoint"),
      isComplete: isComplete("FINANCIAL_ANALYSIS"),
      chatType: "FINANCIAL_ANALYSIS" as const,
    },
    {
      href: `/app/subject/${evaluation?.id}/bias`,
      iconPath: "/icons/bias-analysis.svg",
      title: "Bias\nAnalysis",
      description: "Identify and assess potential biases",
      isActive: pathname.includes("/bias"),
      isComplete: isComplete("BIAS"),
      chatType: "BIAS" as const,
    },
    {
      href: `/app/subject/${evaluation?.id}/leadership`,
      iconPath: "/icons/leadership-analysis.svg",
      title: "Leadership\nAnalysis",
      description: "Evaluate leadership and governance",
      isActive: pathname.includes("/leadership"),
      isComplete: isComplete("LEADERSHIP_ANALYSIS"),
      chatType: "LEADERSHIP_ANALYSIS" as const,
    },
    {
      href: `/app/subject/${evaluation?.id}/program`,
      iconPath: "/icons/program-analysis.svg",
      title: "Program\nAnalysis",
      description: "Analyze program effectiveness",
      isActive: pathname.includes("/program"),
      isComplete: isComplete("PROGRAM_ANALYSIS"),
      chatType: "PROGRAM_ANALYSIS" as const,
    },
    {
      href: `/app/subject/${evaluation?.id}/proposals`,
      iconPath: "/icons/review-proposals.svg",
      title: "Review\nProposals",
      description: "Review and compare proposals",
      isActive: pathname.includes("/proposals"),
      isComplete: false,
      chatType: null,
    },
    {
      href: `/app/subject/${evaluation?.id}/reports`,
      iconPath: "/icons/reports-analysis.svg",
      title: "Reports &\nTools",
      description: "Access reports and analysis tools",
      isActive: pathname.includes("/reports"),
      isComplete: false,
      chatType: null,
    },
  ];

  const activeItem = allAnalysisItems.find(item => item.isActive);
  const inactiveItems = allAnalysisItems.filter(item => !item.isActive);

  return (
    <div className="space-y-4 pl-8">
      <div className="space-y-2 mb-4">
        <h3 className="text-[90%] font-semibold text-gray-900">Take your research deeper</h3>
        <p className="text-[80%] text-gray-600">
          Select the actions you'd like to take with your analysis.
        </p>
      </div>

      {activeItem && (
        <Link href={activeItem.href}>
          <div className={cn(
            "group relative w-full overflow-hidden rounded-[14px] border border-black p-4 shadow-sm transition-all duration-200 hover:shadow-md",
            activeItem.isComplete ? "bg-[#DCD7D28A]" : "bg-gray-100"
          )}>
            <div className="flex items-start justify-between gap-3">
              {activeItem.isComplete && (
                <div className="flex flex-shrink-0 items-center justify-center">
                  <Image
                    src="/icons/checkmark.svg"
                    alt="Completed"
                    width={24}
                    height={24}
                    className="h-6 w-6"
                  />
                </div>
              )}
              <div className="flex flex-1 items-start gap-3">
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-gray-900">{activeItem.title}</h4>
                  <p className="mt-1 text-xs text-gray-600">
                    {activeItem.description}
                  </p>
                </div>
              </div>
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center">
                <Image
                  src={activeItem.iconPath}
                  alt={activeItem.title}
                  width={28}
                  height={28}
                  className="h-7 w-7"
                />
              </div>
            </div>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-3 gap-4">
        {inactiveItems.map((item) => {
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "group relative flex flex-col items-center gap-2 rounded-[14px] p-3 text-center transition-all duration-200 hover:shadow-sm",
                item.isComplete ? "bg-[#DCD7D28A]" : "bg-gray-100"
              )}>
                {item.isComplete && (
                  <div className="absolute left-2 top-2 flex items-center justify-center">
                    <Image
                      src="/icons/checkmark.svg"
                      alt="Completed"
                      width={16}
                      height={16}
                      className="h-4 w-4"
                    />
                  </div>
                )}
                <div className="flex h-12 w-12 items-center justify-center">
                  <Image
                    src={item.iconPath}
                    alt={item.title}
                    width={32}
                    height={32}
                    className="h-8 w-8"
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 leading-tight whitespace-pre-line">
                  {item.title}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}