"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface GradientContainerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export const GradientMediumContainer = ({
  className,
  children,
  ...props
}: GradientContainerProps) => {
  return (
    <div
      className={cn(
        "relative h-full min-h-screen w-full overflow-hidden bg-[#e9f8fd]",
        className,
      )}
      {...props}
    >
      {/* Primary gradient overlays */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(circle at 0% 0%, rgba(188, 234, 249, 0.35) 0%, transparent 70%)",
        }}
      />

      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(circle at 100% 100%, rgba(196, 240, 255, 0.14) 0%, transparent 70%)",
        }}
      />

      <div
        className="absolute inset-0 opacity-20"
        style={{
          background:
            "linear-gradient(207.59deg, rgba(233, 255, 246, 0.29) 17.16%, rgba(113, 214, 247, 0.1392) 87.85%)",
        }}
      />

      {/* Content container */}
      <div className="relative z-10 h-full w-full">{children}</div>
    </div>
  );
};
