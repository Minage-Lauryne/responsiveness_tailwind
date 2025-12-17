import {
  adminProtectedProcedure,
  createTRPCRouter,
  // orgAdminProtectedProcedure, 
} from "@/server/api/trpc";
import { db } from "@/server/db";
import { runs } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import type { ResearchDocument } from "@prisma/client";
import { getSearchQuery } from "@/services/lexical-search/get-search-query";

const researchDocumentSchema = z.object({
  url: z.string().optional().nullable(),
  supabaseId: z.string().optional().nullable(),
  studyTitle: z.string(),
  abstract: z.string(),
  citation: z.string(),
  studyLink: z.string().url(),
  gdiveLink: z.string().url().optional(),
  metaAnalysisTitle: z.string().optional(),
  wsippLink: z.string().url().optional(),
  gdriveMetaAnalysisLink: z.string().url().optional(),
  status: z.string(),
  isArchived: z.boolean().optional(),
});

export const researchDocumentsRouter = createTRPCRouter({
  update: adminProtectedProcedure
    .input(z.object({ id: z.string(), data: researchDocumentSchema }))
    .mutation(async ({ input }) => {
      await db.researchDocument.update({
        where: { id: input.id },
        data: {
          studyTitle: input.data.studyTitle,
          abstract: input.data.abstract,
          citation: input.data.citation,
          studyLink: input.data.studyLink,
          gdiveLink: input.data.gdiveLink ?? null,
          metaAnalysisTitle: input.data.metaAnalysisTitle ?? null,
          wsippLink: input.data.wsippLink ?? null,
          gdriveMetaAnalysisLink: input.data.gdriveMetaAnalysisLink ?? null,
          status: input.data.status,
          fileUrl: input.data.studyLink,
          isArchived: input.data.isArchived ?? false,
        },
      });

      return { id: input.id };
    }),

  list: adminProtectedProcedure 
    .input(z.object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(100).default(10),
      sortBy: z.string().optional(),
      sortOrder: z.enum(["asc", "desc"]).default("desc"),
    }))
    .query(async ({ input }) => {
      const { page, pageSize, sortBy, sortOrder } = input;
      const skip = (page - 1) * pageSize;

      const [items, total] = await Promise.all([
        db.researchDocument.findMany({
          skip,
          take: pageSize,
          orderBy: {
            [sortBy ?? "uploadDate"]: sortOrder,
          },
        }),
        db.researchDocument.count(),
      ]);

      return {
        items,
        total,
        page,
        pageSize,
        pageCount: Math.ceil(total / pageSize),
      };
    }),

  getById: adminProtectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return db.researchDocument.findFirstOrThrow({
        where: { id: input.id },
        include: { chunks: true },
      });
    }),

  getTriggerTaskDetails: adminProtectedProcedure
    .input(z.object({ taskId: z.string() }))
    .query(async ({ input }) => {
      try {
        const runResult = await runs.retrieve(input.taskId);

        const errorMessage = runResult.status === "FAILED" && runResult.error
          ? {
              message: runResult.error.message,
              stackTrace: runResult.error.stackTrace,
            }
          : null;

        return {
          success: true,
          status: runResult.status,
          isSuccess: runResult.status === "COMPLETED",
          isFailed: runResult.status === "FAILED",
          errorMessage,
          output: runResult.output,
          startedAt: runResult.startedAt,
          finishedAt: runResult.finishedAt,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to retrieve trigger task details",
        };
      }
    }),

  listAll: adminProtectedProcedure.query(async () => {
    return db.researchDocument.findMany({
      take: 100,
      include: { chunks: true },
    });
  }),

  search: adminProtectedProcedure
    .input(z.object({
      query: z.string(),
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(100).default(10),
    }))
    .query(async ({ input }) => {
      const { query, page, pageSize } = input;
      const skip = (page - 1) * pageSize;

      if (!query.trim()) {
        const [items, total] = await Promise.all([
          db.researchDocument.findMany({
            skip,
            take: pageSize,
            orderBy: { uploadDate: "desc" },
          }),
          db.researchDocument.count(),
        ]);

        return {
          items,
          total,
          page,
          pageSize,
          pageCount: Math.ceil(total / pageSize),
        };
      }

      const searchQuery = getSearchQuery(query);
      if (!searchQuery) {
        return { items: [], total: 0, page, pageSize, pageCount: 0 };
      }

      const [items, total] = await Promise.all([
        db.$queryRaw<ResearchDocument[]>`
          SELECT *, ts_rank_cd(
            to_tsvector('english', "abstract" || ' ' || "citation" || ' ' || "studyTitle"),
            to_tsquery('english', ${searchQuery})
          ) as rank
          FROM "ResearchDocument"
          WHERE to_tsvector('english', "abstract" || ' ' || "citation" || ' ' || "studyTitle") @@ to_tsquery('english', ${searchQuery})
          AND "isArchived" = false
          ORDER BY rank DESC, "uploadDate" DESC
          LIMIT ${pageSize}
          OFFSET ${skip}
        `,
        db.$queryRaw<[{ count: number }]>`
          SELECT COUNT(*)::integer as count
          FROM "ResearchDocument"
          WHERE to_tsvector('english', "abstract" || ' ' || "citation" || ' ' || "studyTitle") @@ to_tsquery('english', ${searchQuery})
          AND "isArchived" = false
        `,
      ]);

      return {
        items,
        total: total[0].count,
        page,
        pageSize,
        pageCount: Math.ceil(total[0].count / pageSize),
      };
    }),

  getByIds: adminProtectedProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .query(async ({ input }) => {
      return db.researchDocument.findMany({
        where: { id: { in: input.ids } },
      });
    }),
});