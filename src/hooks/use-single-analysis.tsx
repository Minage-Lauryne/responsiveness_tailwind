"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Message } from "ai";
import { createId } from "@paralleldrive/cuid2";
import type {
  ChatRequest,
  ChatResponse,
  SingleAnalysisResponse,
  AnalysisType,
} from "@/types/single-analysis";

interface UseSingleAnalysisProps {
  subjectId: string;
  chatType: AnalysisType;
  initialMessages?: Message[];
  analysisId?: string;
}

interface UseSingleAnalysisReturn {
  messages: Message[];
  status: "ready" | "submitted" | "streaming" | "error";
  input: string;
  setInput: (input: string) => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  append: (message: Message) => Promise<void>;
  setMessages: (messages: Message[]) => void;
  error: Error | null;
  analysisId: string | undefined;
  reload: () => Promise<void>;
  stop: () => void;
  id: string;
}


export function useSingleAnalysis({
  subjectId,
  chatType,
  initialMessages = [],
  analysisId: initialAnalysisId,
}: UseSingleAnalysisProps): UseSingleAnalysisReturn {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [status, setStatus] = useState<"ready" | "submitted" | "streaming" | "error">("ready");
  const [input, setInput] = useState("");
  const [error, setError] = useState<Error | null>(null);
  const [analysisId, setAnalysisId] = useState<string | undefined>(initialAnalysisId);
  const [chatId] = useState(() => createId());
  const lastFetchedAnalysisId = useRef<string | undefined>();
  
  const streamingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const shouldStopRef = useRef(false);

  useEffect(() => {

    if (
      initialAnalysisId &&
      initialAnalysisId !== lastFetchedAnalysisId.current &&
      messages.length === 0
    ) {
      lastFetchedAnalysisId.current = initialAnalysisId;

      const fetchAnalysis = async () => {
        setStatus("submitted");
        try {
          console.log(`Fetching analysis: ${initialAnalysisId}`);
          const response = await fetch(
            `/api/single-analysis/get?id=${initialAnalysisId}`,
            {
              method: "GET",
              credentials: "include",
            }
          );

          if (!response.ok) {
            throw new Error("Failed to fetch analysis");
          }

          const data = (await response.json()) as SingleAnalysisResponse;

          const assistantMessage: Message = {
            id: createId(),
            role: "assistant",
            content: data.response_text,
            parts: [
              {
                type: "text",
                text: data.response_text,
              },
            ],
            createdAt: new Date(data.created_at),
          };

          setMessages([assistantMessage]);
          setAnalysisId(initialAnalysisId);
          setStatus("ready");
        } catch (err) {
          console.error("Failed to fetch analysis:", err);
          setError(err as Error);
          setStatus("error");
        }
      };

      void fetchAnalysis();
    }
  }, [initialAnalysisId, messages.length]);

  useEffect(() => {
    return () => {
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
      }
    };
  }, []);


  const simulateStreaming = useCallback(
    (
      fullText: string,
      messageId: string,
      onComplete?: () => void
    ): void => {
      console.log("simulateStreaming called with:", { 
        textLength: fullText.length, 
        messageId,
        firstWords: fullText.substring(0, 50) 
      });
      
      const words = fullText.split(" ");
      let currentIndex = 0;
      let currentContent = "";
      shouldStopRef.current = false;

      console.log("Total words to stream:", words.length);

      streamingIntervalRef.current = setInterval(() => {
        if (shouldStopRef.current || currentIndex >= words.length) {
          if (streamingIntervalRef.current) {
            clearInterval(streamingIntervalRef.current);
            streamingIntervalRef.current = null;
          }
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId
                ? {
                    ...msg,
                    content: fullText,
                    parts: [{ type: "text" as const, text: fullText }],
                  }
                : msg
            )
          );
          setStatus("ready");
          onComplete?.();
          return;
        }

        currentContent += (currentIndex > 0 ? " " : "") + words[currentIndex];
        currentIndex++;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? {
                  ...msg,
                  content: currentContent,
                  parts: [{ type: "text" as const, text: currentContent }],
                }
              : msg
          )
        );
      }, 50); 
    },
    []
  );

  const stop = useCallback(() => {
    shouldStopRef.current = true;
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
      streamingIntervalRef.current = null;
    }
    setStatus("ready");
  }, []);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!input.trim() || status === "submitted" || status === "streaming") return;

      setStatus("submitted");
      setError(null);

      const userMessage: Message = {
        id: createId(),
        role: "user",
        content: input.trim(),
        parts: [
          {
            type: "text",
            text: input.trim(),
          },
        ],
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      const userInput = input.trim();
      setInput("");

      try {
        let response: Response;

        if (analysisId) {
          const chatRequest: ChatRequest = {
            analysis_id: analysisId,
            message: userInput,
          };

          response = await fetch("/api/single-analysis-chats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(chatRequest),
          });
        } else {
          response = await fetch("/api/single-analysis/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              message: userInput,
              chat_type: chatType,
            }),
          });
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = analysisId
          ? ((await response.json()) as ChatResponse)
          : ((await response.json()) as SingleAnalysisResponse);

        if ("id" in data && !analysisId) {
          setAnalysisId(data.id);
        }

        const assistantMessageId = createId();
        const assistantMessage: Message = {
          id: assistantMessageId,
          role: "assistant",
          content: "",
          parts: [
            {
              type: "text",
              text: "",
            },
          ],
          createdAt: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setStatus("streaming");

        let responseText: string;
        if ("messages" in data && data.messages && data.messages.length > 0) {
          const aiMessage = data.messages.find((msg) => msg.role === "assistant");
          if (!aiMessage?.content) {
            throw new Error("No assistant message found in response");
          }
          responseText = aiMessage.content;
        } else if ("ai_message" in data && data.ai_message) {
          responseText = data.ai_message.content;
        } else if ("response_text" in data) {
          responseText = data.response_text;
        } else {
          throw new Error("Invalid response format from Django");
        }

        simulateStreaming(responseText, assistantMessageId);
      } catch (err) {
        console.error("Analysis error:", err);
        setError(err as Error);
        setStatus("error");
        
        setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));
      }
    },
    [input, status, analysisId, chatType, simulateStreaming]
  );

  const append = useCallback(
    async (message: Message) => {
      console.log("Append called with message:", message);
      
      if (!message.content || message.content.trim() === "") {
        console.log("Skipping empty message");
        return;
      }

      if (status === "submitted" || status === "streaming") {
        console.log("Already processing, skipping");
        return;
      }

      console.log("Processing append for follow-up chat, analysisId:", analysisId);
      setStatus("submitted");
      setError(null);

      const userMessage: Message = {
        ...message,
        id: message.id || createId(),
        createdAt: message.createdAt || new Date(),
        parts: message.parts || [
          {
            type: "text",
            text: message.content,
          },
        ],
      };

      setMessages((prev) => [...prev, userMessage]);
      const userContent = message.content.trim();

      try {
        const isInitialAnalysis = !analysisId;

        if (isInitialAnalysis) {
          console.error("Cannot append without analysisId");
          setStatus("error");
          return;
        }

        const response = await fetch("/api/single-analysis-chats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            analysis_id: analysisId,
            message: userContent,
            chat_type: chatType,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({})) as { error?: string };
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = (await response.json()) as ChatResponse;
        console.log("Received chat response:", data);

        let aiMessageContent: string;
        console.log("Extracting AI message from response...");
        console.log("Messages array:", data.messages);
        
        if (data.messages && data.messages.length > 0) {
          console.log("Using new format - messages array");
          const aiMessage = data.messages.find((msg) => msg.role === "assistant");
          console.log("Found AI message:", aiMessage);
          
          if (!aiMessage?.content) {
            console.error("Invalid response format - no assistant message:", data);
            throw new Error("Invalid response format from Django - no assistant message found");
          }
          aiMessageContent = aiMessage.content;
          console.log("AI message content length:", aiMessageContent.length);
        } else if (data.ai_message?.content) {
          console.log("Using legacy format - ai_message field");
          aiMessageContent = data.ai_message.content;
        } else {
          console.error("Invalid response format:", data);
          throw new Error("Invalid response format from Django - no response content");
        }

        const assistantMessageId = createId();
        const assistantMessage: Message = {
          id: assistantMessageId,
          role: "assistant",
          content: "",
          parts: [
            {
              type: "text",
              text: "",
            },
          ],
          createdAt: new Date(),
        };

        console.log("Adding assistant message placeholder, ID:", assistantMessageId);
        setMessages((prev) => {
          console.log("Current messages before adding:", prev.length);
          const newMessages = [...prev, assistantMessage];
          console.log("Messages after adding assistant:", newMessages.length);
          return newMessages;
        });
        setStatus("streaming");

        console.log("Response text length:", aiMessageContent.length);
        console.log("Starting streaming simulation...");

        simulateStreaming(aiMessageContent, assistantMessageId);
      } catch (err) {
        console.error("Analysis error:", err);
        setError(err as Error);
        setStatus("error");
        
        setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));
      }
    },
    [status, analysisId, chatType, simulateStreaming]
  );

  const reload = useCallback(async () => {
    console.warn("Reload not implemented for Django backend");
  }, []);

  return {
    messages,
    status,
    input,
    setInput,
    handleSubmit,
    append,
    setMessages,
    error,
    analysisId,
    reload,
    stop,
    id: chatId,
  };
}
