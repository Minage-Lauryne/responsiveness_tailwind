import { useMessages } from "@/hooks/use-messages";
import type { UseChatHelpers } from "@ai-sdk/react";
import type { Vote } from "@prisma/client";
import type { UIMessage } from "ai";
import equal from "fast-deep-equal";
import { motion } from "framer-motion";
import { memo } from "react";
import { PreviewMessage, ThinkingMessage } from "./message";

interface MessagesProps {
  chatId: string;
  status: UseChatHelpers["status"];
  votes: Array<Vote> | undefined;
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers["setMessages"];
  reload: UseChatHelpers["reload"];
  isReadonly: boolean;
  isArtifactVisible: boolean;
  hideFirstMessage?: boolean;
}

function PureMessages({
  chatId,
  status,
  votes,
  messages,
  setMessages,
  reload,
  isReadonly,
  hideFirstMessage,
}: MessagesProps) {
  const {
    containerRef: messagesContainerRef,
    endRef: messagesEndRef,
    onViewportEnter,
    onViewportLeave,
  } = useMessages({
    chatId,
    status,
  });

  return (
    <div
      ref={messagesContainerRef}
      className="relative flex min-w-0 flex-1 flex-col gap-6 overflow-y-scroll pt-0"
    >
      {messages.map((message, index) => {
        if (hideFirstMessage && index === 0) {
          return null;
        }

        if (status === "error") {
          return null;
        }

        return (
          <PreviewMessage
            key={message.id}
            chatId={chatId}
            message={message}
            isLoading={status === "streaming" && messages.length - 1 === index}
            vote={
              votes
                ? votes.find((vote) => vote.messageId === message.id)
                : undefined
            }
            setMessages={setMessages}
            reload={reload}
            isReadonly={isReadonly}
          />
        );
      })}

      {status !== "error" &&
        status === "submitted" &&
        messages.length > 0 &&
        messages[messages.length - 1]?.role === "user" && <ThinkingMessage />}

      <motion.div
        ref={messagesEndRef}
        className="min-h-[24px] min-w-[24px] shrink-0"
        onViewportLeave={onViewportLeave}
        onViewportEnter={onViewportEnter}
      />
    </div>
  );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  if (prevProps.isArtifactVisible && nextProps.isArtifactVisible) return true;

  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.status && nextProps.status) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (prevProps.hideFirstMessage !== nextProps.hideFirstMessage) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;
  if (!equal(prevProps.votes, nextProps.votes)) return false;

  return true;
});
