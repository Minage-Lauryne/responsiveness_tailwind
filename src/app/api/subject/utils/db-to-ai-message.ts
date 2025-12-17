import { Attachment, Message } from "ai";
import { Message as DBMessage } from "@prisma/client";

export function dbToAIMessage(message: DBMessage): Message {
  const { id, role, parts, attachments, createdAt } = message;
  return {
    id,
    role: role as "user" | "system" | "assistant",
    content: "",
    parts: parts as any,
    experimental_attachments: (attachments as unknown as Attachment[]).map(
      (attachment) => ({
        url: attachment.url,
        name: attachment.name,
        contentType: attachment.contentType,
      }),
    ),
    createdAt,
  };
}
