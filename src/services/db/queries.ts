import "server-only";

import db from "@/server/db";

import { Message, User } from "@prisma/client";
import { InputJsonValue } from "@prisma/client/runtime/library";

export async function getUser(email: string): Promise<Array<User>> {
  return db.user.findMany({ where: { email } });
}

export async function saveChat({
  id,
  userId,
  title,
  organizationId,
}: {
  id: string;
  userId: string;
  title: string;
  organizationId: string;
}) {
  return await db.chat.create({
    data: {
      id,
      createdAt: new Date(),
      userId,
      title,
      organizationId,
    },
  });
}

export async function deleteChatById({ id }: { id: string }) {
  const p = db.vote.deleteMany({ where: { chatId: id } });
  const m = db.message.deleteMany({ where: { chatId: id } });

  const c = db.chat.delete({ where: { id } });

  return db.$transaction([p, m, c]);
}

export async function getChatsByUserId({ id }: { id: string }) {
  return db.chat.findMany({
    where: { userId: id },
    orderBy: { createdAt: "desc" },
  });
}

export async function getChatById({ id }: { id: string }) {
  return db.chat.findUnique({ where: { id } });
}

export async function saveMessages({ messages }: { messages: Message[] }) {
  return await db.message.createMany({
    data: messages.map((message) => ({
      id: message.id,
      chatId: message.chatId,
      role: message.role,
      createdAt: message.createdAt,
      parts: message.parts as InputJsonValue,
      attachments: message.attachments
        ? (message.attachments as InputJsonValue)
        : [],
    })),
  });
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: "up" | "down";
}) {
  const existingVote = await db.vote.findUnique({
    where: {
      chatId_messageId: {
        chatId,
        messageId,
      },
    },
  });

  if (existingVote) {
    return await db.vote.update({
      where: {
        chatId_messageId: {
          chatId,
          messageId,
        },
      },
      data: { isUpvoted: type === "up" },
    });
  }

  return await db.vote.create({
    data: {
      chatId,
      messageId,
      isUpvoted: type === "up",
    },
  });
}

export async function getVotesByChatId({ id }: { id: string }) {
  return db.vote.findMany({ where: { chatId: id } });
}

// Suggestion functions removed since Suggestion model was deleted
// These were only used by the unused artifact system

export async function getMessageById({ id }: { id: string }) {
  return db.message.findFirstOrThrow({ where: { id } });
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  const messagesToDelete = await db.message.findMany({
    where: {
      chatId,
      createdAt: { gt: timestamp },
    },
  });

  const messageIds = messagesToDelete.map((message) => message.id);

  if (messageIds.length > 0) {
    await db.vote.deleteMany({
      where: {
        messageId: { in: messageIds },
        chatId,
      },
    });
  }

  await db.message.deleteMany({
    where: {
      id: { in: messageIds },
      chatId,
    },
  });
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: {
  id: string;
  differenceInHours: number;
}) {
  try {
    const twentyFourHoursAgo = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000,
    );

    const count = await db.message.count({
      where: {
        chat: {
          userId: id,
        },
        createdAt: {
          gte: twentyFourHoursAgo,
        },
        role: "user",
      },
    });

    return count;
  } catch (error) {
    throw new Error("Failed to get message count by user id");
  }
}

export async function getStreamIdsByChatId({ id }: { id: string }) {
  return db.stream.findMany({ where: { chatId: id } });
}
