"use client";

import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { SparklesIcon } from "lucide-react";
import { useChat, type Message } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Markdown } from "@/features/chat/components/markdown";
import { stripVerificationLog } from "@/lib/utils/strip-verification-log";
import { AIDisclaimer } from "@/components/complere/ai-disclaimer";
import Sidepanel from "../Sidepanel";
import { Overview } from "../Overview";
import { Matrix } from "../../Matrix";
import { Details } from "../Details";
import { ResearchEvidence } from "../ResearchEvidence";
import type { AnalysisData, Proposal } from "../types";
import { LoadingCardSpinner } from "@/features/shared/loading-spinner";

function normalizeResult(raw: AnalysisData): Proposal[] {
  return raw.proposals;
}

const SUGGESTIONS = [
  "Clarify the assessment criteria",
  "Show gaps preventing recommendation",
  "Break down the strengths and weaknesses",
  "Help me interpret the proposal differences",
];

function PreviewMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div
      className={cn(
        "flex gap-3 mb-3 max-w-[85%]",
        isUser ? "ml-auto justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border">
          <SparklesIcon size={14} />
        </div>
      )}
      <div
        className={cn(
          "rounded-xl px-4 py-3 text-sm whitespace-pre-wrap",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        )}
      >
        <Markdown>{stripVerificationLog(String(message.content))}</Markdown>
      </div>
      {isUser && <div className="size-8" />}
    </div>
  );
}

function CustomMultimodalInput({
  value,
  onChange,
  onSubmit,
  disabled,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  disabled?: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <form onSubmit={onSubmit} className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        placeholder="Ask a question about this analysis..."
        className="w-full resize-none overflow-hidden rounded-xl bg-slate-50 border border-input px-4 py-3 text-base outline-none focus:ring-2 focus:ring-primary"
        rows={1}
        disabled={disabled}
      />
      <Button
        type="submit"
        size="icon"
        variant="ghost"
        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-granite text-primary-foreground hover:bg-primary/90 hover:text-white"
        disabled={disabled}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m5 12 7-7 7 7" />
          <path d="M12 19V5" />
        </svg>
      </Button>
    </form>
  );
}

export default function ComparativeAnalysisViewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [collapsed, setCollapsed] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollingProgress, setPollingProgress] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"overview" | "matrix" | "details" | "evidence">("evidence");

  const {
    messages,
    input,
    handleInputChange,
    setMessages,
  } = useChat({
    api: "/api/analysis-chat",
    onError: (error) => {
      console.error("Chat API error:", error);
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const loadingMessages = ["Thinking", "Working through the details", "Gathering relevant information", "One moment, preparing your results", "Almost done"];
  const [currentLoadingMessageIndex, setCurrentLoadingMessageIndex] = useState(0);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;
    let attempts = 0;
    const maxAttempts = 45; // 15 minutes with 20-second intervals
    const pollIntervalMs = 20000; // 20 seconds

    async function fetchAnalysis() {
      setLoading(true);
      setError(null);
      try {
        console.log(`[Polling] Fetching analysis from /api/analyze?id=${id}`);
        const response = await fetch(`/api/analyze?id=${id}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        console.log(`[Polling] Response status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[Polling] Error response:`, errorText);
          setError(`Failed to fetch analysis: ${response.status} ${response.statusText} - ${errorText}`);
          setLoading(false);
          setPollingProgress(null);
          return;
        }

        const data = await response.json();
        console.log(`[Polling] Received data:`, data);
        
        // Check if analysis is still in progress
        if (data?.title === "Analysis in progress...") {
          attempts++;
          const elapsedMinutes = Math.floor((attempts * pollIntervalMs) / 60000);
          const elapsedSeconds = Math.floor((attempts * pollIntervalMs) / 1000) % 60;
          const progressMsg = `Analysis in progress... ${elapsedMinutes}m ${elapsedSeconds}s elapsed`;
          setPollingProgress(progressMsg);
          // Keep loading state true during polling
          setLoading(true);
          console.log(`[Polling] ${progressMsg} (attempt ${attempts}/${maxAttempts}) - loading: true`);
          
          if (attempts >= maxAttempts) {
            setError("Analysis is taking longer than expected. Please refresh the page to check again.");
            setLoading(false);
            setPollingProgress(null);
            return;
          }
          
          // Continue polling every 20 seconds
          // Keep loading true while waiting for next poll
          if (!pollInterval) {
            pollInterval = setInterval(() => {
              void fetchAnalysis();
            }, pollIntervalMs);
          }
          // Don't set loading to false - keep it true during the wait
          return;
        }
        
        // Analysis complete - stop polling and show results
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
        setPollingProgress(null);
        
        console.log('[Polling] Analysis complete - showing results');
        setAnalysisData(data);
        setLoading(false);
        
        // Trigger event so sidebar can refresh its list
        if (typeof window !== "undefined") {
          console.log('[Polling] Dispatching analysis:updated event');
          window.dispatchEvent(new CustomEvent("analysis:updated"));
        }
      } catch (err) {
        console.error("Error fetching analysis:", err);
        
        // Don't stop polling on transient errors
        attempts++;
        if (attempts < maxAttempts) {
          // Keep loading true and continue polling
          setLoading(true);
          setPollingProgress(`Retrying... (attempt ${attempts}/${maxAttempts})`);
          if (!pollInterval) {
            pollInterval = setInterval(() => {
              void fetchAnalysis();
            }, pollIntervalMs);
          }
        } else {
          setError(err instanceof Error ? err.message : "Failed to fetch analysis");
          setLoading(false);
          setPollingProgress(null);
        }
      }
    }

    if (id) {
      void fetchAnalysis();
    }

    // Cleanup interval on unmount
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [id]);

  const proposals = useMemo(() => {
    const result = analysisData ? normalizeResult(analysisData) : [];
    return result;
  }, [analysisData]);
  const rfpSummary = useMemo(() => analysisData?.rfp_summary, [analysisData]);

  const recommendedCount = useMemo(() =>
    proposals.filter((p) => p.recommendation === "Recommended").length,
    [proposals]
  );
  const analysedCount = useMemo(() => proposals.length, [proposals]);
  const budgetSummary = useMemo(() => {
    if (rfpSummary?.budget_range) return rfpSummary.budget_range;
    const b = proposals.find((p) => p.budget && p.budget !== "Not described");
    return b ? b.budget : "Not available";
  }, [proposals, rfpSummary]);
  const timelineSummaryRaw = useMemo(() => {
    if (rfpSummary?.timeline_expectations) return rfpSummary.timeline_expectations;
    const t = proposals.find((p) => p.timeline && p.timeline !== "Not specified");
    return t ? t.timeline : "Not available";
  }, [proposals, rfpSummary]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isLoading) {
      interval = setInterval(() => {
        setCurrentLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 5000);
    } else {
      setCurrentLoadingMessageIndex(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading, loadingMessages.length]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 40);
    return () => window.clearTimeout(id);
  }, [messages, isLoading]);

  function generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  const sendTextMessage = useCallback(
    async (text: string) => {
      if (!text?.trim() || isLoading) return;
      const trimmed = text.trim();

      const userMessage: Message = {
        id: generateId(),
        role: "user",
        content: trimmed,
      };
      setMessages((prev) => [...prev, userMessage]);

      handleInputChange({ target: { value: "" } } as React.ChangeEvent<HTMLTextAreaElement>);
      setIsLoading(true);

      try {
        const body = {
          messages: [...messages, userMessage],
          context: { proposals },
          submission_id: analysisData?.rfp_id ?? null,
        };

        const res = await fetch("/api/analysis-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        let assistantText = "No response.";

        if (data.messages && Array.isArray(data.messages)) {
          const assistantMessages = data.messages.filter((msg: any) =>
            msg.role === 'assistant' || msg.role === 'ai' || msg.role === 'bot'
          );

          if (assistantMessages.length > 0) {
            const lastAssistantMsg = assistantMessages[assistantMessages.length - 1];
            assistantText = lastAssistantMsg.content?.toString() || assistantText;
          } else if (data.messages.length > 0) {
            const lastMessage = data.messages[data.messages.length - 1];
            assistantText = lastMessage.content?.toString() || assistantText;
          }
        }
        else if (data.content) {
          assistantText = data.content.toString();
        }

        const aiMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: assistantText
        };
        setMessages((prev) => [...prev, aiMessage]);
      } catch (error) {
        const errorMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: `Sorry, I couldn't process your request. Please try again`,
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 80);
      }
    },
    [messages, proposals, analysisData, isLoading, setMessages, handleInputChange]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendTextMessage(input);
  };

  const handleSuggestionClick = async (suggestion: string) => {
    await sendTextMessage(suggestion);
  };

  const handleSuggestionClickButton = (suggestion: string) => {
    void handleSuggestionClick(suggestion);
  };

  const handleSuggestionKeyDown = (e: React.KeyboardEvent, suggestion: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      void handleSuggestionClick(suggestion);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white text-slate-800">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 max-w-md">
            <LoadingCardSpinner />
            {pollingProgress ? (
              <div className="text-center space-y-3">
                <div className="text-xl font-semibold text-gray-800">{pollingProgress}</div>
                <div className="text-sm text-gray-600">
                  This analysis may take 5-15 minutes. Results will appear automatically when complete.
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">Your submission ID:</div>
                  <div className="text-sm font-mono text-gray-700 bg-gray-50 px-3 py-2 rounded">
                    {id}
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  You can safely navigate away and return to this page later.
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-lg font-medium text-gray-800">Loading analysis...</div>
                <div className="text-sm text-gray-600 mt-2">Please wait</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (error || !analysisData) {
    return (
      <div className="flex min-h-screen bg-white text-slate-800">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-800">Analysis not found</h2>
            <p className="mt-2 text-gray-600">
              {error || "This analysis doesn't exist or you don't have access to it."}
            </p>
            <button
              onClick={() => router.push("/app/subject/list")}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Back to List
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white text-slate-800 overflow-x-hidden">
      <Sidepanel
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        analysisData={analysisData}
        loading={false}
      />

      <div className="flex-1 min-w-0 p-4 bg-white overflow-x-hidden">
        <div className="w-full max-w-full px-4 sm:px-6 md:px-8">
          <div className="flex items-start gap-3 mb-6">
            <div className="size-8 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border p-2 flex">
              <SparklesIcon size={16} />
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div className="flex-1"></div>
            <div>
              <div className="inline-flex rounded-lg bg-white ring-1 ring-border overflow-hidden">
                <button
                  onClick={() => {
                    setActiveTab("evidence");
                    setCollapsed(false);
                  }}
                  className={cn(
                    "px-5 py-2 text-sm font-medium focus:outline-none border-l border-gray-100",
                    activeTab === "evidence" ? "bg-ocean text-white" : "text-gray-600 hover:bg-slate-50"
                  )}
                >
                  Initial Analysis
                </button>
                <button
                  onClick={() => {
                    setActiveTab("overview");
                    setCollapsed(true);
                  }}
                  className={cn(
                    "px-5 py-2 text-sm font-medium focus:outline-none border-l border-gray-100",
                    activeTab === "overview" ? "bg-ocean text-white" : "text-gray-600 hover:bg-slate-50"
                  )}
                >
                  Overview
                </button>
                <button
                  onClick={() => {
                    setActiveTab("matrix");
                    setCollapsed(true);
                  }}
                  className={cn(
                    "px-5 py-2 text-sm font-medium focus:outline-none border-l border-gray-100",
                    activeTab === "matrix" ? "bg-ocean text-white" : "text-gray-600 hover:bg-slate-50"
                  )}
                >
                  Evaluation Matrix
                </button>
                <button
                  onClick={() => {
                    setActiveTab("details");
                    setCollapsed(true);
                  }}
                  className={cn(
                    "px-5 py-2 text-sm font-medium focus:outline-none border-l border-gray-100",
                    activeTab === "details" ? "bg-ocean text-white" : "text-gray-600 hover:bg-slate-50"
                  )}
                >
                  Detailed Analysis
                </button>
              </div>
            </div>
          </div>

          <div className="mt-2">
            {activeTab === "evidence" && <ResearchEvidence proposals={proposals} />}
            {activeTab === "overview" && (
              <Overview
                analysisData={analysisData}
                proposals={proposals}
                budgetSummary={budgetSummary}
                timelineSummaryRaw={timelineSummaryRaw}
                recommendedCount={recommendedCount}
                analysedCount={analysedCount}
              />
            )}
            {activeTab === "matrix" && <Matrix proposals={proposals} collapsed={collapsed} />}
            {activeTab === "details" && <Details proposals={proposals} />}
          </div>

          <section className="mt-8 pb-6">
            <h2 className="font-medium mb-3">Need help understanding this comparison?</h2>

            <div className="flex flex-wrap gap-2 mb-4">
              {SUGGESTIONS.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClickButton(suggestion)}
                  onKeyDown={(e) => handleSuggestionKeyDown(e, suggestion)}
                  className="px-4 py-2 text-sm rounded-lg border border-input bg-white hover:bg-slate-50 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <div className="space-y-3 mb-4">
              {messages.map((msg) => (
                <PreviewMessage key={msg.id} message={msg} />
              ))}

              {isLoading && (
                <div className="flex gap-3 mb-3 max-w-[85%] justify-start">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border">
                    <SparklesIcon size={14} />
                  </div>
                  <div className="rounded-xl px-4 py-3 text-sm bg-muted text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <div className="font-medium">{loadingMessages[currentLoadingMessageIndex]}</div>
                      <div className="flex">
                        <span className="animate-bounce">.</span>
                        <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
                        <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <CustomMultimodalInput
              value={input}
              onChange={handleInputChange}
              onSubmit={handleSubmit}
              disabled={isLoading}
            />
          </section>

          <AIDisclaimer />
        </div>
      </div>
    </div>
  );
}