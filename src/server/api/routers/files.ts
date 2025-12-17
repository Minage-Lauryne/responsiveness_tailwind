import db from "@/server/db";
import { extractText } from "@/services/extracting/extract-text";
import { getUploadUrl } from "@/services/supabase";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getWorkspaceContext } from "@/lib/workspace";

export const filesRouter = createTRPCRouter({
  getUploadUrl: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        bucket: z.string().optional(),
      }),
    )
    .output(
      z.object({
        signedUrl: z.string(),
        token: z.string(),
        path: z.string(),
        publicUrl: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      return getUploadUrl(userId, input.fileName, input.bucket);
    }),
  createUserDocument: protectedProcedure
    .input(
      z.object({
        id: z.string().optional(),
        fileName: z.string(),
        fileType: z.string(),
        filePath: z.string(),
        fileSize: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const organizationId = ctx.session.session.activeOrganizationId;

      const workspaceDoc = await ctx.db.workspaceDocument.create({
        data: {
          id: input.id, // Use the provided ID if available
          name: input.fileName,
          fileType: input.fileType,
          supabaseURL: input.filePath,
          addedById: ctx.session.user.id,
          organizationId: organizationId || null,
        },
      });

      try {
        const lowerType = (input.fileType || "").toLowerCase();

        const isPdf = lowerType === "application/pdf";
        const isWord =
          lowerType === "application/msword" ||
          lowerType ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        const isText = lowerType.startsWith("text/");

        const shouldExtractText = isPdf || isWord || isText;

        if (shouldExtractText) {
          await extractText(workspaceDoc);
        }
      } catch (error) {
        console.error(error);
        await ctx.db.workspaceDocument.delete({
          where: { id: workspaceDoc.id },
        });
        throw error;
      }

      return workspaceDoc;
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const organizationId = ctx.session.session.activeOrganizationId;
    const workspaceContext = getWorkspaceContext(ctx.session.user.id, organizationId);

    const whereClause = workspaceContext.type === "personal"
      ? { organizationId: null, addedById: ctx.session.user.id }
      : { organizationId: workspaceContext.organizationId };

    const files = await db.workspaceDocument.findMany({
      where: whereClause,
      include: {
        addedBy: {
          select: {
            firstName: true,
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return files.map((file) => ({
      ...file,
      isUploadedByCurrentUser: file.addedBy.id === ctx.session.user.id,
    }));
  }),
});
