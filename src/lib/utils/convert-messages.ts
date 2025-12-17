import { Message } from "@prisma/client";
import { Attachment, UIMessage } from "ai";

export function convertToUIMessages(
  messages: Array<Message>,
): Array<UIMessage> {
  return messages.map((message) => ({
    id: message.id,
    parts: Array.isArray(message.parts)
      ? (message.parts as UIMessage["parts"])
      : typeof message.parts === "string"
        ? [{ text: message.parts, type: "text" as const }]
        : [],
    role: message.role as UIMessage["role"],
    // Note: content will soon be deprecated in @ai-sdk/react
    content: "",
    createdAt: message.createdAt,
    experimental_attachments:
      (message.attachments as unknown as Array<Attachment>) ?? [],
  }));
}
