import { z } from "zod";
import { createTRPCRouter, publicProcedure, adminProtectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { Prisma } from "@prisma/client";

function normalizeOrgName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(inc|incorporated|llc|corporation|corp|co|ltd|limited)\b/gi, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getStatusInfo(code: string | null) {
  const statusMap: Record<string, { label: string; allowed: boolean; variant: string }> = {
    "01": { label: "Unconditional Exemption", allowed: true, variant: "success" },
    "02": { label: "Conditional Exemption", allowed: true, variant: "success" },
    "12": { label: "Trust (IRC 4947(a)(2))", allowed: true, variant: "success" },
    "20": { label: "Church/Integrated Auxiliary", allowed: true, variant: "success" },
    "13": { label: "Revoked", allowed: false, variant: "destructive" },
    "25": { label: "Terminating", allowed: false, variant: "warning" },
    "21": { label: "Other Status", allowed: true, variant: "secondary" },
    "22": { label: "Other Status", allowed: true, variant: "secondary" },
    "23": { label: "Other Status", allowed: true, variant: "secondary" },
    "24": { label: "Other Status", allowed: true, variant: "secondary" },
    "26": { label: "Other Status", allowed: true, variant: "secondary" },
    "27": { label: "Other Status", allowed: true, variant: "secondary" },
  };
  
  return statusMap[code || ""] || { label: "IRS Verified", allowed: true, variant: "success" };
}

function getSubsectionDescription(code: string | null): string {
  const subsectionMap: Record<string, string> = {
    "03": "501(c)(3) - Charitable Organization",
    "04": "501(c)(4) - Social Welfare Organization",
    "05": "501(c)(5) - Labor/Agricultural Organization",
    "06": "501(c)(6) - Business League",
    "07": "501(c)(7) - Social/Recreation Club",
    "08": "501(c)(8) - Fraternal Beneficiary Society",
    "09": "501(c)(9) - Voluntary Employees' Beneficiary Association",
    "10": "501(c)(10) - Domestic Fraternal Society",
    "11": "501(c)(11) - Teachers' Retirement Fund",
    "12": "501(c)(12) - Benevolent Life Insurance Association",
    "13": "501(c)(13) - Cemetery Company",
    "14": "501(c)(14) - Credit Union",
    "15": "501(c)(15) - Mutual Insurance Company",
    "19": "501(c)(19) - Veterans' Organization",
  };
  
  return subsectionMap[code || ""] || (code ? `501(c)(${code}) Organization` : "Unknown");
}

export const irsRouter = createTRPCRouter({
  searchOrganization: publicProcedure
    .input(z.object({
      name: z.string().min(3),
      limit: z.number().min(1).max(20).default(10),
    }))
    .query(async ({ input }) => {
      const normalized = normalizeOrgName(input.name);
      const searchPattern = `%${normalized}%`;

      const results = await db.$queryRaw<Array<{
        ein: string;
        organization_name: string;
        tax_period: string | null;
        subsection: string | null;
        exemption_status: string | null;
        ruling_date: string | null;
      }>>`
        SELECT ein, organization_name, tax_period, subsection, exemption_status, ruling_date
        FROM irs_organization_data
        WHERE LOWER(REGEXP_REPLACE(organization_name, '[^a-zA-Z0-9\\s]', '', 'g')) ILIKE ${searchPattern}
        ORDER BY organization_name
        LIMIT ${input.limit}
      `;
      
      return results.map((org: typeof results[number]) => {
        const statusInfo = getStatusInfo(org.exemption_status);
        return {
          ein: org.ein,
          name: org.organization_name,
          taxPeriod: org.tax_period,
          subsection: org.subsection,
          subsectionDescription: getSubsectionDescription(org.subsection),
          exemptionStatus: org.exemption_status,
          statusLabel: statusInfo.label,
          isAllowed: statusInfo.allowed,
          statusVariant: statusInfo.variant,
          rulingDate: org.ruling_date,
        };
      });
    }),
    
  checkByDomain: publicProcedure
    .input(z.object({
      domain: z.string(),
    }))
    .query(async ({ input }) => {
      if (!input.domain || input.domain.trim() === "") {
        return { organization: null };
      }

      try {
        const cleanDomain = input.domain.toLowerCase().trim();
        
        const existingOrg = await db.organization.findFirst({
          where: {
            OR: [
              { domains: { some: { domain: cleanDomain } } },
              { domain: { contains: cleanDomain } },
            ],
            irsEin: { not: null },
          },
          select: {
            irsEin: true,
            irsOrganizationName: true,
            irsExemptionStatus: true,
            irsSubsectionCode: true,
            irsTaxPeriod: true,
            irsVerified: true,
            domain: true,
            domains: {
              where: {
                domain: cleanDomain
              },
              select: {
                domain: true
              }
            }
          },
        });

        if (existingOrg && existingOrg.irsEin) {
          const statusInfo = getStatusInfo(existingOrg.irsExemptionStatus);
          return {
            organization: {
              ein: existingOrg.irsEin,
              name: existingOrg.irsOrganizationName || "",
              taxPeriod: existingOrg.irsTaxPeriod,
              subsection: existingOrg.irsSubsectionCode,
              subsectionDescription: getSubsectionDescription(existingOrg.irsSubsectionCode),
              exemptionStatus: existingOrg.irsExemptionStatus,
              statusLabel: statusInfo.label,
              isAllowed: statusInfo.allowed,
              statusVariant: statusInfo.variant,
            },
          };
        }

        return { organization: null };

      } catch (error) {
        console.error("Error checking IRS by domain:", error);
        return { organization: null };
      }
    }),

  backfillVerification: adminProtectedProcedure
    .mutation(async () => {
      const orgs = await db.organization.findMany({
        where: {
          verificationStatus: "NOT_CHECKED",
          isUSBased: true,
        },
      });
      
      let verified = 0;
      let notFound = 0;
      let inactive = 0;
      
      for (const org of orgs) {
        const normalized = normalizeOrgName(org.name);
        const searchPattern = `%${normalized}%`;

        const results = await db.$queryRaw<Array<{
          ein: string;
          organization_name: string;
          exemption_status: string | null;
          subsection: string | null;
          tax_period: string | null;
        }>>`
          SELECT ein, organization_name, exemption_status, subsection, tax_period
          FROM irs_organization_data
          WHERE LOWER(REGEXP_REPLACE(organization_name, '[^a-zA-Z0-9\\s]', '', 'g')) ILIKE ${searchPattern}
          LIMIT 1
        `;
        
        if (results.length > 0) {
          const irsOrg = results[0]!;
          const statusInfo = getStatusInfo(irsOrg.exemption_status);
          
          await db.organization.update({
            where: { id: org.id },
            data: {
              irsEin: irsOrg.ein,
              irsOrganizationName: irsOrg.organization_name,
              irsExemptionStatus: irsOrg.exemption_status,
              irsSubsectionCode: irsOrg.subsection,
              irsTaxPeriod: irsOrg.tax_period,
              irsVerified: statusInfo.allowed,
              verificationStatus: statusInfo.allowed ? "VERIFIED" : "INACTIVE",
              irsVerifiedAt: new Date(),
            },
          });
          
          if (statusInfo.allowed) {
            verified++;
          } else {
            inactive++;
          }
        } else {
          await db.organization.update({
            where: { id: org.id },
            data: {
              verificationStatus: "NOT_FOUND",
              irsVerifiedAt: new Date(),
            },
          });
          notFound++;
        }
      }
      
      return { verified, notFound, inactive, total: orgs.length };
    }),
});