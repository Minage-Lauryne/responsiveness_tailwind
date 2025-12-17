import { db } from "@/server/db";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { Prisma, ChatType } from "@prisma/client";
import {
  getChatById,
  getVotesByChatId,
  voteMessage,
} from "@/services/db/queries";
import { getWorkspaceContext } from "@/lib/workspace";

const chatInclude = {
  _count: {
    select: {
      messages: true,
    },
  },
} as const;

type ChatWithCount = Prisma.ChatGetPayload<{ include: typeof chatInclude }>;

export const chatRouter = createTRPCRouter({
  getChat: protectedProcedure
    .input(z.object({ chatId: z.string() }))
    .query(async ({ input, ctx }) => {
      const organizationId = ctx.session.session.activeOrganizationId;
      const workspaceContext = getWorkspaceContext(ctx.session.user.id, organizationId);

      const { chatId } = input;

      const whereClause = workspaceContext.type === "personal"
        ? { id: chatId, organizationId: null, userId: ctx.session.user.id }
        : { id: chatId, organizationId: workspaceContext.organizationId };

      const chat = await db.chat.findFirst({
        where: whereClause,
        include: {
          messages: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

      // Return null if chat doesn't exist in the current workspace context
      if (!chat) {
        return null;
      }

      return chat;
    }),

  getChatBySubjectAndType: protectedProcedure
    .input(z.object({ 
      subjectId: z.string(),
      chatType: z.nativeEnum(ChatType)
    }))
    .query(async ({ input, ctx }) => {
      const organizationId = ctx.session.session.activeOrganizationId;
      const workspaceContext = getWorkspaceContext(ctx.session.user.id, organizationId);

      const { subjectId, chatType } = input;

      const chatWhereClause = workspaceContext.type === "personal"
        ? { SubjectId: subjectId, type: chatType, organizationId: null, userId: ctx.session.user.id }
        : { SubjectId: subjectId, type: chatType, organizationId: workspaceContext.organizationId };

      const chat = await db.chat.findFirst({
        where: chatWhereClause,
        include: {
          messages: {
            orderBy: {
              createdAt: "asc",
            },
            skip: 1,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const subjectWhereClause = workspaceContext.type === "personal"
        ? { id: subjectId, organizationId: null, createdById: ctx.session.user.id }
        : { id: subjectId, organizationId: workspaceContext.organizationId };

      const subject = await db.subject?.findFirst({
        where: subjectWhereClause,
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          createdById: true,
          organizationId: true,
          isArchived: true,
          title: true,
          context: true,
          djangoAnalysisIds: true,
          documents: {
            select: {
              name: true,
              id: true,
            },
          },
        },
      });

      // If subject doesn't exist in the current workspace context, return null for both
      if (!subject) {
        return {
          chat: null,
          subject: null,
        };
      }

      return {
        chat,
        subject,
      };
    }),

  getHistory: protectedProcedure
    .input(
      z.object({
        type: z.enum(["saved", "recent", "searches"]),
        limit: z.number().min(1).max(50).optional().default(20),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { type, limit } = input;

      const organizationId = ctx.session.session.activeOrganizationId;
      const workspaceContext = getWorkspaceContext(ctx.session.user.id, organizationId);

      const whereClause = workspaceContext.type === "personal"
        ? { organizationId: null, userId: ctx.session.user.id }
        : { organizationId: workspaceContext.organizationId };

      const chats = await db.chat.findMany({
        where: whereClause,
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        include: chatInclude,
      });

      return chats satisfies ChatWithCount[];
    }),

  getVotes: protectedProcedure
    .input(z.object({ chatId: z.string() }))
    .query(async ({ input, ctx }) => {
      const { chatId } = input;

      // Verify user owns the chat
      const chat = await getChatById({ id: chatId });
      // if (!chat) {
      //   throw new Error("Chat not found");
      // }
      // if (chat.userId !== ctx.session.user.id) {
      //   throw new Error("Unauthorized");
      // }
      if (!chat) {
        return [];
      }

      return await getVotesByChatId({ id: chatId });
    }),

  vote: protectedProcedure
    .input(
      z.object({
        chatId: z.string(),
        messageId: z.string(),
        type: z.enum(["up", "down"]),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { chatId, messageId, type } = input;

      // Verify user owns the chat
      const chat = await getChatById({ id: chatId });
      if (!chat) {
        throw new Error("Chat not found");
      }
      if (chat.userId !== ctx.session.user.id) {
        throw new Error("Unauthorized");
      }

      return await voteMessage({
        chatId,
        messageId,
        type,
      });
    }),

  getUserChats: protectedProcedure
  .query(async ({ ctx }) => {
    const organizationId = ctx.session.session.activeOrganizationId;
    const workspaceContext = getWorkspaceContext(ctx.session.user.id, organizationId);

    const whereClause =
      workspaceContext.type === "personal"
        ? { userId: ctx.session.user.id, organizationId: null }
        : { userId: ctx.session.user.id, organizationId: workspaceContext.organizationId };

    const chats = await db.chat.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        type: true,
        Subject: { select: { title: true } },
      },
      take: 200, 
    });

    return chats;
  }),
  getAllUserChats: protectedProcedure
  .query(async ({ ctx }) => {
    const chats = await db.chat.findMany({
      where: { 
        userId: ctx.session.user.id,
        deletedAt: null, 
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        type: true,
        organizationId: true, 
        Subject: { select: { title: true } },
      },
      take: 500,
    });

    return chats;
  }),
});
