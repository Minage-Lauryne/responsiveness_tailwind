import { z } from "zod";
import {
  createTRPCRouter,
  orgOrAdminProtectedProcedure,
} from "@/server/api/trpc";
import { db } from "@/server/db";
import { getOrganizationFilings } from "@/services/form990/propublica";

const CACHE_DURATION_DAYS = 30;

export const form990Router = createTRPCRouter({
  getFilings: orgOrAdminProtectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const organization = await db.organization.findUnique({
        where: { id: input.organizationId },
        select: {
          id: true,
          name: true,
          irsEin: true,
          irsVerified: true,
        },
      });

      if (!organization?.irsEin || !organization.irsVerified) {
        return { filings: [] };
      }

      const cachedFilings = await db.form990Filing.findMany({
        where: { organizationId: input.organizationId },
        orderBy: { taxYear: "desc" },
      });

      if (cachedFilings.length > 0) {
        const latestCache = cachedFilings[0];
        if (latestCache) {
          const daysSinceCache = Math.floor(
            (Date.now() - latestCache.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysSinceCache < CACHE_DURATION_DAYS) {
            return { filings: cachedFilings };
          }
        }
      }

      try {
        const propublicaData = await getOrganizationFilings(organization.irsEin);

        if (!propublicaData || !propublicaData.filings_with_data) {
          return { filings: cachedFilings };
        }

        const filings = await Promise.all(
          propublicaData.filings_with_data.map(async (filing) => {
            return await db.form990Filing.upsert({
              where: {
                ein_taxYear: {
                  ein: organization.irsEin!,
                  taxYear: filing.tax_prd_yr,
                },
              },
              update: {
                pdfUrl: filing.pdf_url,
                totalRevenue: filing.totrevenue ? BigInt(filing.totrevenue) : null,
                totalExpenses: filing.totfuncexpns ? BigInt(filing.totfuncexpns) : null,
                totalAssets: filing.totassetsend ? BigInt(filing.totassetsend) : null,
              },
              create: {
                organizationId: input.organizationId,
                ein: organization.irsEin!,
                taxYear: filing.tax_prd_yr,
                pdfUrl: filing.pdf_url,
                totalRevenue: filing.totrevenue ? BigInt(filing.totrevenue) : null,
                totalExpenses: filing.totfuncexpns ? BigInt(filing.totfuncexpns) : null,
                totalAssets: filing.totassetsend ? BigInt(filing.totassetsend) : null,
              },
            });
          })
        );

        return {
          filings: filings.sort((a, b) => b.taxYear - a.taxYear),
        };
      } catch (error) {
        console.error("Error fetching Form 990 data:", error);
        return { filings: cachedFilings };
      }
    }),
});