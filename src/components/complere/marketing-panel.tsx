"use client";

import { ArrowRightIcon } from "lucide-react";
import { GradientContainer } from "@/components/complere/gradient";

interface MarketingPanelProps {
  title?: string;
  description?: string;
  ctaText?: string;
  betaMessage?: string;
}

export function MarketingPanel({
  title = "Expand your foundation's impact with AI.",
  description = "Complēre helps program staff use AI workflows\nfor better grantmaking, evaluation, and strategic planning.",
  ctaText = "Get Started",
  betaMessage = "We're currently in beta version. Enter your email to create your account and start using the platform. Your feedback is highly valued and share your insights to help us improve!",
}: MarketingPanelProps) {
  return (
    <div className="hidden flex-1 lg:block">
      <GradientContainer className="flex h-full w-full flex-col justify-center overflow-hidden p-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            {title}
          </h1>
          <div className="mt-6 text-xl whitespace-pre-line">{description}</div>
          <div className="mt-8 flex flex-col gap-4 rounded-xl bg-white/20 p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <ArrowRightIcon className="h-5 w-5" />
              <div className="font-medium">{ctaText}</div>
            </div>
            <div>{betaMessage}</div>
          </div>
        </div>
      </GradientContainer>
    </div>
  );
}
