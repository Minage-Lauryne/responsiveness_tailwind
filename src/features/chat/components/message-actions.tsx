import type { Message } from "ai";
import { useCopyToClipboard } from "usehooks-ts";

import { Vote } from "@prisma/client";
import { api } from "@/trpc/react";
import type { AppRouter } from "@/server/api/root";

import { CopyIcon, ThumbDownIcon, ThumbUpIcon } from "./icons";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { memo } from "react";
import equal from "fast-deep-equal";
import { toast } from "sonner";

function PureMessageActions({
  chatId,
  message,
  vote,
  isLoading,
}: {
  chatId: string;
  message: Message;
  vote: Vote | undefined;
  isLoading: boolean;
}) {
  const [, copyToClipboard] = useCopyToClipboard();
  const utils = api.useUtils();
  const voteMutation = api.chat.vote.useMutation({
    onSuccess: () => {
      // Invalidate and refetch votes
      void utils.chat.getVotes.invalidate({ chatId });
    },
  });

  if (isLoading) return null;
  if (message.role === "user") return null;

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-row gap-2 pt-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="h-fit px-2 py-1 text-muted-foreground"
              variant="outline"
              onClick={async () => {
                const textFromParts = message.parts
                  ?.filter((part) => part.type === "text")
                  .map((part) => part.text.replace(/\[\[\[VERIFICATION_LOG\]\]\][\s\S]*?\[\[\[\/VERIFICATION_LOG\]\]\]/g, '').trim())
                  .join("\n")
                  .trim();

                if (!textFromParts) {
                  toast.error("There's no text to copy!");
                  return;
                }

                await copyToClipboard(textFromParts);
                toast.success("Copied to clipboard!");
              }}
            >
              <CopyIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              data-testid="message-upvote"
              className="!pointer-events-auto h-fit px-2 py-1 text-muted-foreground"
              disabled={vote?.isUpvoted}
              variant="outline"
              onClick={async () => {
                toast.promise(
                  voteMutation.mutateAsync({
                    chatId,
                    messageId: message.id,
                    type: "up",
                  }),
                  {
                    loading: "Upvoting Response...",
                    success: "Upvoted Response!",
                    error: "Failed to upvote response.",
                  },
                );
              }}
            >
              <ThumbUpIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Upvote Response</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              data-testid="message-downvote"
              className="!pointer-events-auto h-fit px-2 py-1 text-muted-foreground"
              variant="outline"
              disabled={vote && !vote.isUpvoted}
              onClick={async () => {
                toast.promise(
                  voteMutation.mutateAsync({
                    chatId,
                    messageId: message.id,
                    type: "down",
                  }),
                  {
                    loading: "Downvoting Response...",
                    success: "Downvoted Response!",
                    error: "Failed to downvote response.",
                  },
                );
              }}
            >
              <ThumbDownIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Downvote Response</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

export const MessageActions = memo(
  PureMessageActions,
  (prevProps, nextProps) => {
    if (!equal(prevProps.vote, nextProps.vote)) return false;
    if (prevProps.isLoading !== nextProps.isLoading) return false;

    return true;
  },
);
