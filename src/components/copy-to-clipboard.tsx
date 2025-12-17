"use client";

import { Check, Copy } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { cn } from "./utils";

export function CopyToClipboard({
  children,
  text,
  className,
  toastText,
}: {
  children?: React.ReactNode;
  text?: string;
  className?: string;
  toastText?: string;
}) {
  const [copied, setCopied] = useState(false);

  const ref = React.useRef<HTMLDivElement>(null);

  const copyToClipboard = async () => {
    const t = text ? text : ref.current?.innerText ?? "";
    try {
      await navigator.clipboard.writeText(t);
    } catch (error) {
      fallbackCopyTextToClipboard(t);
    }
    toast(<>Copied {toastText ?? <strong>{t}</strong>} to clipboard</>);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <>
      <div className={cn("flex items-center space-x-0", className)}>
        {children && (
          <div ref={ref} className="inline">
            {children}
          </div>
        )}
        <Button
          onClick={copyToClipboard}
          variant="ghost"
          size="sm"
          className="ml-0"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </Button>
      </div>
    </>
  );
}

function fallbackCopyTextToClipboard(text: string) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    document.execCommand("copy");
  } catch (err) {
    console.error("Fallback: Oops, unable to copy", err);
  }

  document.body.removeChild(textArea);
}
