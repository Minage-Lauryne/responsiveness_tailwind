import { myProvider } from "@/features/chat/providers";
import db from "@/server/db";
import { generateSubjectAndRequestDocumentUrls } from "@/services/email/generate-document-urls";
import { sendMail } from "@/services/email/resend";
import { getResearchRequestParams } from "@/services/email/templates/admin/research-request-template";
import { InputJsonValue } from "@prisma/client/runtime/library";
import { generateObject } from "ai";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getWorkspaceContext, isPersonalWorkspace } from "@/lib/workspace";

async function checkSubjectPermission(
  userId: string,
  organizationId: string | null | undefined,
  action: "create" | "view" | "edit" | "delete"
) {
  if (isPersonalWorkspace(organizationId)) {
    return null;
  }

  const member = await db.member.findFirst({
    where: {
      userId,
      organizationId: organizationId!,
    },
  });

  if (!member) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not a member of this organization",
    });
  }

  switch (action) {
    case "view":
      return member;
    case "create":
    case "edit":
      if (member.role === "VIEWER") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Viewers cannot create or edit analysis",
        });
      }
      return member;
    case "delete":
      if (member.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can delete analysis",
        });
      }
      return member;
    default:
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid action",
      });
  }
}

export const subjectRouter = createTRPCRouter({
  get: protectedProcedure.input(z.string()).query(async ({ input, ctx }) => {
    const organizationId = ctx.session.session.activeOrganizationId;
    const workspaceContext = getWorkspaceContext(ctx.session.user.id, organizationId);

    await checkSubjectPermission(ctx.session.user.id, organizationId, "view");

    const whereClause = workspaceContext.type === "personal"
      ? { id: input, organizationId: null, createdById: ctx.session.user.id }
      : { id: input, organizationId: workspaceContext.organizationId };

    const subject = await db.subject.findFirst({
      where: whereClause,
      include: {
        researchRequest: true,
        documents: true,
        chats: {
          include: {
            _count: {
              select: {
                messages: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            deletedAt: true,
          },
        },
      },
    });

    if (!subject) {
      return null;
    }

    return subject;
  }),

  getWithDocuments: protectedProcedure.input(z.string()).query(async ({ input, ctx }) => {
    const organizationId = ctx.session.session.activeOrganizationId;
    const workspaceContext = getWorkspaceContext(ctx.session.user.id, organizationId);

    const whereClause = workspaceContext.type === "personal"
      ? { id: input, organizationId: null, createdById: ctx.session.user.id }
      : { id: input, organizationId: workspaceContext.organizationId };

    const subject = await db.subject.findFirst({
      where: whereClause,
      include: {
        documents: {
          select: {
            name: true,
            id: true,
          },
        },
      },
    });

    if (!subject) {
      return null;
    }

    return subject;
  }),

  create: protectedProcedure
    .input(
      z.object({
        context: z.string(),
        files: z.array(z.string()),
        djangoAnalysisId: z.string().optional(),
        chatType: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const organizationId = ctx.session.session.activeOrganizationId;

      await checkSubjectPermission(ctx.session.user.id, organizationId, "create");

      const djangoAnalysisIds = input.djangoAnalysisId && input.chatType
        ? { [input.chatType]: input.djangoAnalysisId }
        : undefined;

      const resp = await db.subject.create({
        data: {
          context: input.context,
          createdById: ctx.session.user.id,
          organizationId: organizationId || null,
          djangoAnalysisIds: djangoAnalysisIds,
          documents: {
            connect: input.files.map((file) => ({ id: file })),
          },
        },
      });

      return resp;
    }),

  updateDjangoAnalysisId: protectedProcedure
    .input(
      z.object({
        subjectId: z.string(),
        chatType: z.string(),
        analysisId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const organizationId = ctx.session.session.activeOrganizationId;
      
      await checkSubjectPermission(ctx.session.user.id, organizationId, "edit");

      const subject = await db.subject.findUnique({
        where: { id: input.subjectId },
        select: { djangoAnalysisIds: true },
      });

      if (!subject) {
        throw new Error("Subject not found");
      }

      const currentIds = (subject.djangoAnalysisIds || {}) as Record<string, string>;
      const updatedIds = {
        ...currentIds,
        [input.chatType]: input.analysisId,
      };

      const resp = await db.subject.update({
        where: { id: input.subjectId },
        data: {
          djangoAnalysisIds: updatedIds,
        },
      });

      return resp;
    }),

  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().optional().default(3),
      }),
    )
    .query(async ({ input, ctx }) => {
      const organizationId = ctx.session.session.activeOrganizationId;
      const workspaceContext = getWorkspaceContext(ctx.session.user.id, organizationId);

      await checkSubjectPermission(ctx.session.user.id, organizationId, "view");

      const whereClause = workspaceContext.type === "personal"
        ? { organizationId: null, createdById: ctx.session.user.id, isArchived: false }
        : { organizationId: workspaceContext.organizationId, isArchived: false };

      const resp = await db.subject.findMany({
        where: whereClause,
        take: input.limit > 0 ? input.limit : undefined,
        include: {
          documents: {
            select: {
              name: true,
            },
          },
          createdBy: {
            select: {
              name: true,
              firstName: true,
              deletedAt: true,
            },
          },
          originalCreatedBy: {
            select: {
              name: true,
              firstName: true,
              deletedAt: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      return resp;
    }),

  createTitle: protectedProcedure.input(z.string()).query(async ({ input, ctx }) => {
    const organizationId = ctx.session.session.activeOrganizationId;
    const workspaceContext = getWorkspaceContext(ctx.session.user.id, organizationId);

    const id = input;
    const whereClause = workspaceContext.type === "personal"
      ? { id, organizationId: null, createdById: ctx.session.user.id }
      : { id, organizationId: workspaceContext.organizationId };

    const subject = await db.subject.findFirst({
      where: whereClause,
      include: {
        documents: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!subject) {
      return null;
    }

    if (subject.title) {
      return subject.title;
    }

    const {
      object: { title },
    } = await generateObject({
      schema: z.object({
        title: z.string().describe("The title of the analysis"),
      }),
      model: myProvider.languageModel("title-model"),
      system: `\n
      - You will generate a short title of an analysis we are working on.
      - Ensure this title is not more than 30 characters long.
      - The title should be a short version of the document names and potential additional context given.
      - Do not use quotes or colons.`,
      prompt: `
          We are creating an analysis with documents of the following names: ${subject.documents.map((doc) => doc.name).join("\n ")}
          ${subject.context ? `This additional context was given for creating the analysis: ${subject.context}` : ""}
          `,
    });

    await db.subject.update({
      where: { id },
      data: { title },
    });
    console.log("title updated");
    return title;
  }),

  createChat: protectedProcedure
    .input(z.string())
    .mutation(async ({ input, ctx }) => {
      const organizationId = ctx.session.session.activeOrganizationId;
      const workspaceContext = getWorkspaceContext(ctx.session.user.id, organizationId);

      const subjectId = input;
      const userId = ctx.session.user.id;

      const whereClause = workspaceContext.type === "personal"
        ? { id: subjectId, organizationId: null, createdById: userId }
        : { id: subjectId, organizationId: workspaceContext.organizationId };

      const subject = await db.subject.findFirst({
        where: whereClause,
      });

      if (!subject) {
        return null;
      }

      const newChat = await db.chat.create({
        data: {
          title: "",
          userId: userId,
          organizationId: organizationId || null,
          SubjectId: subjectId,
        },
      });

      return newChat;
    }),

  createResearchRequest: protectedProcedure
    .input(
      z.object({
        subjectId: z.string().optional(),
        context: z.string().optional(),
        documentIds: z.array(z.string()).optional(),
        withExpertReview: z.boolean(),
        contactName: z.string().optional(),
        email: z.string().optional(),
        organization: z.string().optional(),
        researchTitle: z.string().optional(),
        researchObjective: z.string().optional(),
        sectorFocus: z.string().optional(),
        selectedService: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const organizationId = ctx.session.session.activeOrganizationId;
      const workspaceContext = getWorkspaceContext(ctx.session.user.id, organizationId);

      if (input.subjectId) {
        const whereClause = workspaceContext.type === "personal"
          ? { id: input.subjectId, organizationId: null, createdById: ctx.session.user.id }
          : { id: input.subjectId, organizationId: workspaceContext.organizationId };

        const subject = await db.subject.findFirst({
          where: whereClause,
        });

        if (!subject) {
          throw new Error("Subject not found or access denied");
        }

        const existingRequest = await db.researchRequest.findUnique({
          where: {
            subjectId: input.subjectId,
          },
        });

        if (existingRequest) {
          throw new Error("A research request already exists for this subject");
        }
      }

      const researchRequest = await db.researchRequest.create({
        data: {
          subjectId: input.subjectId, 
          context: input.context,
          createdById: ctx.session.user.id,
          organizationId: organizationId || null,
          withExpertReview: input.withExpertReview,
          contactName: input.contactName,
          email: input.email,
          organization: input.organization,
          researchTitle: input.researchTitle,
          researchObjective: input.researchObjective,
          sectorFocus: input.sectorFocus,
          selectedService: input.selectedService,
          documents: input.documentIds
            ? {
              connect: input.documentIds.map((id) => ({ id })),
            }
            : undefined,
        },
        include: {
          documents: {
            select: {
              id: true,
              name: true,
              fileType: true,
              supabaseURL: true,
            },
          },
          createdBy: {
            select: {
              email: true,
              name: true,
              firstName: true,
            },
          },
          subject: {
            select: {
              id: true,
              title: true,
              context: true,
              documents: {
                select: {
                  id: true,
                  name: true,
                  fileType: true,
                  supabaseURL: true,
                },
              },
            },
          },
        },
      });

      const { subjectDocuments, requestDocuments } =
        await generateSubjectAndRequestDocumentUrls(
          input.subjectId || null,
          researchRequest.documents?.map((d) => d.id) || [],
        );

      await sendMail(getResearchRequestParams, {
        userEmail: researchRequest.createdBy?.email || "unknown@email.com",
        userName:
          researchRequest.createdBy?.name ||
          researchRequest.createdBy?.firstName ||
          researchRequest.contactName ||
          undefined,
        subjectTitle:
          researchRequest.subject?.title ||
          researchRequest.researchTitle ||
          "Research Request",
        subjectContext: researchRequest.subject?.context || "",
        requestContext: researchRequest.context || undefined,
        subjectId: input.subjectId || "standalone",
        contactName: researchRequest.contactName || undefined,
        contactEmail: researchRequest.email || undefined,
        organization: researchRequest.organization || undefined,
        researchTitle: researchRequest.researchTitle || undefined,
        researchObjective: researchRequest.researchObjective || undefined,
        sectorFocus: researchRequest.sectorFocus || undefined,
        selectedService: researchRequest.selectedService || undefined,
        withExpertReview: researchRequest.withExpertReview,
        subjectDocuments,
        requestDocuments,
      });

      return researchRequest;
    }),

  archive: protectedProcedure
    .input(z.string())
    .mutation(async ({ input, ctx }) => {
      const organizationId = ctx.session.session.activeOrganizationId;
      const workspaceContext = getWorkspaceContext(ctx.session.user.id, organizationId);

      await checkSubjectPermission(ctx.session.user.id, organizationId, "delete");

      const subjectId = input;

      const whereClause = workspaceContext.type === "personal"
        ? { id: subjectId, organizationId: null, createdById: ctx.session.user.id }
        : { id: subjectId, organizationId: workspaceContext.organizationId };

      const subject = await db.subject.findFirst({
        where: whereClause,
      });

      if (!subject) {
        throw new Error("Subject not found or access denied");
      }

      const updatedSubject = await db.subject.update({
        where: {
          id: subjectId,
        },
        data: {
          isArchived: true,
        },
      });

      return updatedSubject;
    }),
});