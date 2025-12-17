"use client";

import { forwardRef } from "react";

interface SimpleTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const SimpleTextarea = forwardRef<
  HTMLTextAreaElement,
  SimpleTextareaProps
>(({ className = "", ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={`w-[1305px] h-[158px] resize-none rounded-2xl border-[1.4px] border-stone bg-[#F1F8FF] px-6 py-4 text-[18px] font-500 leading-[122%] placeholder:italic placeholder:text-granite focus:border-stone focus:outline-none ${className}`}
      {...props}
    />
  );
});

SimpleTextarea.displayName = "SimpleTextarea";
