"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface GradientContainerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export const GradientContainer = ({
  className,
  children,
  ...props
}: GradientContainerProps) => {
  return (
    <div
      className={cn(className)}
      style={{
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#E9FFF6",
      }}
      {...props}
    >
      {/* Darker blue in bottom left - larger and more prominent */}
      <div
        className="absolute"
        style={{
          width: "70%",
          height: "70%",
          bottom: "0",
          left: "0",
          background:
            "radial-gradient(circle at 0% 100%, rgba(70, 144, 213, 0.9) 0%, rgba(70, 144, 213, 0) 80%)",
          filter: "blur(60px)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* Medium blue in middle left */}
      <div
        className="absolute"
        style={{
          width: "60%",
          height: "60%",
          top: "30%",
          left: "0",
          background:
            "radial-gradient(circle at 0% 50%, rgba(110, 191, 244, 0.8) 0%, rgba(110, 191, 244, 0) 80%)",
          filter: "blur(55px)",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />

      {/* Light blue in top left */}
      <div
        className="absolute"
        style={{
          width: "50%",
          height: "50%",
          top: "0",
          left: "0",
          background:
            "radial-gradient(circle at 20% 20%, rgba(165, 239, 255, 0.9) 0%, rgba(165, 239, 255, 0) 70%)",
          filter: "blur(40px)",
          zIndex: 3,
          pointerEvents: "none",
        }}
      />

      {/* Lighter gradient on the right - covers more of the right side */}
      <div
        className="absolute"
        style={{
          width: "80%",
          height: "100%",
          top: "0",
          right: "0",
          background:
            "radial-gradient(circle at 100% 50%, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0) 70%)",
          filter: "blur(60px)",
          zIndex: 4,
          pointerEvents: "none",
        }}
      />

      {/* Light yellow tint on the right - more prominent at top right */}
      <div
        className="absolute"
        style={{
          width: "70%",
          height: "70%",
          top: "0",
          right: "0",
          background:
            "radial-gradient(circle at 90% 30%, rgba(255, 249, 228, 0.6) 0%, rgba(255, 249, 228, 0) 70%)",
          filter: "blur(60px)",
          zIndex: 5,
          pointerEvents: "none",
        }}
      />

      {/* Main content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};
