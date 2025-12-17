import {
  getSignedDownloadUrl,
  getUploadUrl,
  USER_UPLOADS_BUCKET,
} from "@/services/supabase";
import { createId } from "@paralleldrive/cuid2";
import path from "path";
import { z } from "zod";
import { adminProtectedProcedure, createTRPCRouter } from "../trpc";
import { db } from "@/server/db";

export const adminRouter = createTRPCRouter({
  listUsers: adminProtectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        cursor: z.string().optional(),
        search: z.string().optional(),
        isAdmin: z.boolean().optional(),
      }),
    )
    .query(async ({ input }) => {
      const { limit, cursor, search, isAdmin } = input;

      const where: any = {
        deletedAt: null,
      };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ];
      }

      if (isAdmin !== undefined) {
        where.isAdmin = isAdmin;
      }

      const users = await db.user.findMany({
        where,
        take: limit + 1,
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
        orderBy: { createdAt: "desc" },
        include: {
          members: {
            include: {
              organization: {
                select: { id: true, name: true },
              },
            },
          },
          _count: {
            select: { chats: true },
          },
        },
      });

      let nextCursor: string | undefined = undefined;
      if (users.length > limit) {
        const nextItem = users.pop();
        nextCursor = nextItem?.id;
      }

      return {
        users: users.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          isAdmin: user.isAdmin,
          isBetaUser: user.isBetaUser,
          createdAt: user.createdAt,
          chatCount: user._count.chats,
          organizations: user.members.map((m) => ({
            id: m.organization.id,
            name: m.organization.name,
            role: m.role,
          })),
        })),
        nextCursor,
      };
    }),

  listOrganizations: adminProtectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        cursor: z.string().optional(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const { limit, cursor, search } = input;

      const where: any = {};

      if (search) {
        where.name = { contains: search, mode: "insensitive" };
      }

      const organizations = await db.organization.findMany({
        where,
        take: limit + 1,
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { members: true, chats: true },
          },
          subscriptions: {
            where: { status: "active" },
            take: 1,
          },
        },
      });

      let nextCursor: string | undefined = undefined;
      if (organizations.length > limit) {
        const nextItem = organizations.pop();
        nextCursor = nextItem?.id;
      }

      return {
        organizations: organizations.map((org) => ({
          id: org.id,
          name: org.name,
          logo: org.logo,
          createdAt: org.createdAt,
          memberCount: org._count.members,
          chatCount: org._count.chats,
          freeForever: org.freeForever,
          trialEndsAt: org.trialEndsAt,
          hasActiveSubscription: org.subscriptions.length > 0,
          irsVerified: org.irsVerified,
        })),
        nextCursor,
      };
    }),

  listRestorationRequests: adminProtectedProcedure
    .input(
      z.object({
        status: z.enum(["PENDING", "APPROVED", "REJECTED", "EXPIRED", "REJECTED_FINAL"]).optional(),
        limit: z.number().min(1).max(100).default(10),
      }),
    )
    .query(async ({ input }) => {
      const { status, limit } = input;

      const where: any = {};
      if (status) {
        where.status = status;
      }

      const requests = await db.restorationRequest.findMany({
        where,
        take: limit,
        orderBy: { requestedAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              deletedAt: true,
            },
          },
        },
      });

      return requests;
    }),

  getUploadUrl: adminProtectedProcedure
    .input(
      z.object({
        fileName: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const { fileName } = input;
      // Generate a unique ID for the file
      const fileExtension = path.extname(fileName);
      const uniqueId = createId();
      const filePath = `${USER_UPLOADS_BUCKET}/${uniqueId}${fileExtension}`;

      const uploadUrlData = await getUploadUrl(USER_UPLOADS_BUCKET, filePath);
      if (!uploadUrlData) {
        throw new Error("Failed to get upload URL");
      }

      return {
        ...uploadUrlData,
        filePath,
        fileName: path.basename(filePath),
        originalFileName: input.fileName,
        fileType: fileExtension.replace(".", "").toLowerCase(),
      };
    }),

  getSignedDownloadUrl: adminProtectedProcedure
    .input(
      z.object({
        filePath: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const { filePath } = input;
      const downloadUrl = await getSignedDownloadUrl(
        USER_UPLOADS_BUCKET,
        filePath,
      );
      return downloadUrl;
    }),

  getStats: adminProtectedProcedure.query(async () => {
    const [
      chatCount,
      userCount,
      organizationCount,
      activeSubscriptionCount,
      documentCount,
    ] = await Promise.all([
      db.chat.count(),
      db.user.count(),
      db.organization.count(),
      db.subscription.count({
        where: {
          status: "active",
        },
      }),
      db.researchDocument.count(),
    ]);

    return {
      chatCount,
      userCount,
      organizationCount,
      activeSubscriptionCount,
      documentCount,
    };
  }),

  toggleAdminStatus: adminProtectedProcedure
    .input(
      z.object({
        id: z.string(),
        isAdmin: z.boolean(),
      }),
    )
    .mutation(async (opts) => {
      const { id, isAdmin } = opts.input;

      const user = await db.user.update({
        where: {
          id,
        },
        data: {
          isAdmin,
        },
      });

      return user;
    }),
});
