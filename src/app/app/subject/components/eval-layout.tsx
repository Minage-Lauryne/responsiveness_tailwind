"use client";

import { api } from "@/trpc/react";
import { useParams } from "next/navigation";
import { EvalMenu } from "./eval-menu";
import { EvalHeader } from "./header";
import { HeaderDetails } from "./header-details";
import { LoadingBlur } from "./loading-blur";

export function EvalLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const { data: evaluation } = api.subject.get.useQuery(id);

  return (
    <div className="relative">
      <div className="flex gap-8 px-8 pb-8 pt-4">
        <div className="w-2/6">
          {evaluation && (
            <div className="flex flex-col justify-center gap-4">
              <EvalHeader evaluation={evaluation} />
              <HeaderDetails evaluation={evaluation} />
              <EvalMenu evaluation={evaluation} />
            </div>
          )}
        </div>
        <div className="w-4/6">
          <div className="h-full max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl bg-white px-8 pb-0 shadow-sm">
            <div className="flex min-w-0 flex-1 flex-col">{children}</div>
          </div>
        </div>
      </div>
      <LoadingBlur loading={!evaluation} />
    </div>
  );
}
