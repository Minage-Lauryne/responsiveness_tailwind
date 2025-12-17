"use client";

import { ComplereLogoLoading } from "@/components/complere-logo-loading";
import { api } from "@/trpc/react";
import { HeroEval } from "./components/eval-hero/hero-eval";
import { HeroTitle } from "./components/hero-title";
export default function Home() {
  const { isLoading } = api.me.get.useQuery();

  return (
    <div className="relative">
      <div
        className={`flex flex-col gap-8 pt-8 duration-1000 animate-in fade-in ${isLoading ? "pointer-events-none opacity-50 blur-sm" : ""}`}
      >
       <div>
          <HeroTitle />
       </div>
        <div className="lg:col-span-3">
          <HeroEval />
        </div>
      </div>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <ComplereLogoLoading />
            <div className="text-sm font-medium text-gray-600">
              Just a moment...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
