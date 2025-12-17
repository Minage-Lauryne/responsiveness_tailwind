"use client";

import {
  DATA_CITATION_KEYWORD,
  NARRATIVE_KEYWORD,
} from "@/app/api/subject/utils/keyword-enhancement";
import { Button } from "@/components/ui/button";
import { ChatType } from "@prisma/client";
import { ChatRequestOptions, CreateMessage, Message } from "ai";
import { motion } from "framer-motion";
import { memo } from "react";

interface SuggestedActionsProps {
  chatId: string;
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
  chatType: ChatType;
}

interface SuggestedAction {
  title: string;
  label: string;
  action: string;
}

const analysisSuggestedActions: SuggestedAction[] = [
  {
    title: "Check & cite the data points",
    label: "from this analysis",
    action: DATA_CITATION_KEYWORD,
  },
  {
    title: "Run an estimated benefit cost analysis",
    label: "on the program",
    action: "Run an estimated benefit cost analysis",
  },
  {
    title: "Create a summary",
    label: "of the analysis",
    action: "Create a short, 2-page maximum narrative summary of the analysis",
  },
  {
    title: "Write an illustrative fact based narrative",
    label: "for program improvement",
    action: NARRATIVE_KEYWORD,
  },
];

const suggestedActions: Partial<Record<ChatType, SuggestedAction[]>> = {
  [ChatType.ANALYSIS]: analysisSuggestedActions,
};

function PureSuggestedActions({
  chatId,
  append,
  chatType,
}: SuggestedActionsProps) {
  const actions = suggestedActions[chatType];

  // If we don't have any suggested actions, render null
  if (!actions || actions.length === 0) {
    return null;
  }

  return (
    <div
      data-testid="suggested-actions"
      className="grid w-full grid-cols-2 gap-2"
    >
      {actions.map((suggestedAction: SuggestedAction, index: number) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          // className={index > 1 ? "hidden sm:block" : "block"}
        >
          <Button
            variant="ghost"
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              void append({
                role: "user",
                content: suggestedAction.action,
              });
            }}
            className="h-auto w-full flex-1 flex-col items-start justify-start gap-1 rounded-xl border px-4 py-3.5 text-left text-sm"
          >
            <span className="font-medium">{suggestedAction.title}</span>
            <span className="text-muted-foreground">
              {suggestedAction.label}
            </span>
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) return false;

    return true;
  },
);
