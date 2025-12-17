import { z } from "zod";
import { getEmailData } from "@/lib/utils/email";
import {
  adminProtectedProcedure,
  orgOrAdminProtectedProcedure,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure
} from "@/server/api/trpc";
import { db } from "@/server/db";
import { TRPCError } from "@trpc/server";
import { isBefore, addWeeks } from "date-fns";
import { getOrganizationChatCount } from "@/lib/utils/chat-limit";
import crypto from "node:crypto";
import { sendEmail } from "@/services/email/resend";
import { getOrganizationFilings } from "@/services/form990/propublica";

async function checkOrganizationMember(
  userId: string,
  organizationId?: string,
) {
  if (!organizationId) {
    throw new Error("No organization id found");
  }

  const member = await db.member.findFirst({
    where: {
      userId,
      organizationId,
      deletedAt: null,
      user: {
        deletedAt: null,
      },
    },
  });

  if (!member) {
    throw new Error("User is not a member of this organization");
  }

  return member;
}

export async function checkOrganizationAdmin(
  userId: string,
  organizationId?: string,
) {
  if (!organizationId) {
    throw new Error("No organization id found");
  }

  const member = await db.member.findFirst({
    where: {
      userId,
      organizationId,
      role: "ADMIN",
      deletedAt: null,
      user: {
        deletedAt: null,
      },
    },
  });

  if (!member) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You must be an admin to perform this action",
    });
  }

  return member;
}

export const organizationRouter = createTRPCRouter({

  createOrganization: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Organization name is required"),
        domain: z.string().optional(),
        url: z.string().optional(),
        isUSBased: z.boolean().optional(),
        irsVerification: z.object({
          ein: z.string(),
          organizationName: z.string(),
          exemptionStatus: z.string(),
          subsection: z.string().optional(),
          taxPeriod: z.string().optional(),
          verificationStatus: z.enum(["VERIFIED", "NOT_FOUND", "SKIPPED", "INACTIVE", "PENDING_ADMIN"]),
        }).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { name, domain, url, isUSBased, irsVerification } = input;

      const existingOrg = await db.organization.findFirst({
        where: {
          name: {
            equals: name,
            mode: "insensitive",
          },
        },
      });

      if (existingOrg) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An organization with this name already exists. Please choose a different name.",
        });
      }

      const organization = await db.organization.create({
        data: {
          name,
          domain: url,
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
          isUSBased,
          ...(irsVerification && {
            irsEin: irsVerification.ein,
            irsOrganizationName: irsVerification.organizationName,
            irsExemptionStatus: irsVerification.exemptionStatus,
            irsSubsectionCode: irsVerification.subsection,
            irsTaxPeriod: irsVerification.taxPeriod,
            irsVerified: irsVerification.verificationStatus === "VERIFIED",
            verificationStatus: irsVerification.verificationStatus,
            irsVerifiedAt: new Date(),
          }),
        },
      });

      await db.member.create({
        data: {
          organizationId: organization.id,
          userId: ctx.session.user.id,
          role: "ADMIN",
          organizationEmail: ctx.session.user.email ?? undefined,
        },
      });

      if (domain && ctx.session.user.email) {
        const emailData = getEmailData(ctx.session.user.email);
        if (emailData.type === "private" && emailData.domain === domain) {
          const existingDomain = await db.domain.findFirst({
            where: { domain },
          });

          if (!existingDomain) {
            await db.domain.create({
              data: {
                organizationId: organization.id,
                domain,
              },
            });
          }
        }
      }

      await db.session.update({
        where: { id: ctx.session.session.id },
        data: { activeOrganizationId: organization.id },
      });

      if (organization.irsVerified && organization.irsEin) {
        void (async () => {
          try {
            const propublicaData = await getOrganizationFilings(organization.irsEin!);

            if (propublicaData?.filings_with_data) {
              await Promise.all(
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
                      organizationId: organization.id,
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
            }
          } catch (error) {
            console.error("[Form 990] Background fetch failed:", error);
          }
        })();
      }

      return organization;
    }),

  searchOrganizations: publicProcedure
    .input(
      z.object({
        query: z.string().min(1, "Search query is required"),
        limit: z.number().min(1).max(20).default(10),
      }),
    )
    .query(async ({ input }) => {
      const { query, limit } = input;

      const organizations = await db.organization.findMany({
        where: {
          OR: [
            {
              name: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              domains: {
                some: {
                  domain: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
              },
            },
          ],
        },
        include: {
          domains: true,
          _count: {
            select: {
              members: true,
            },
          },
        },
        take: limit,
        orderBy: {
          name: "asc",
        },
      });

      return organizations.map((org: any) => ({
        id: org.id,
        name: org.name,
        domains: org.domains.map((d: any) => d.domain),
        memberCount: org._count.members,
        createdAt: org.createdAt,
      }));
    }),

  requestToJoin: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        message: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { organizationId, message } = input;

      // Check if organization is blocked
      const organization = await db.organization.findFirst({
        where: { id: organizationId },
        select: {
          id: true,
          name: true,
          verificationStatus: true,
        },
      });

      if (!organization) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found",
        });
      }

      if (
        organization.verificationStatus === "PENDING_ADMIN" ||
        organization.verificationStatus === "INACTIVE"
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This organization is pending admin approval and cannot accept new members at this time. Please contact support@complere.ai if you need assistance.",
        });
      }

      if (!ctx.session.user.email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email is required to request organization membership",
        });
      }

      const existingMember = await db.member.findFirst({
        where: {
          userId: ctx.session.user.id,
          organizationId,
        },
      });

      if (existingMember) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You are already a member of this organization",
        });
      }

      const existingRequest = await db.invitation.findFirst({
        where: {
          organizationId,
          email: ctx.session.user.email,
          status: "PENDING",
          type: "JOIN_REQUEST",
        },
      });

      if (existingRequest) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You already have a pending request to join this organization",
        });
      }

      const joinRequest = await db.invitation.create({
        data: {
          organizationId,
          email: ctx.session.user.email,
          role: "MEMBER",
          status: "PENDING",
          type: "JOIN_REQUEST",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          inviterId: ctx.session.user.id,
          message,
        },
      });

      const admins = await db.member.findMany({
        where: {
          organizationId,
          role: "ADMIN",
        },
        include: { user: true },
      });

      const requesterName = ctx.session.user.name ?? ctx.session.user.email;
      const requestDetailsUrl = `${process.env.NEXT_PUBLIC_DEPLOYMENT_URL}/app/organization-admin/requests?org=${organizationId}`;

      for (const admin of admins) {
        if (!admin.user.email) continue;
        await sendEmail(
          admin.user.email,
          `New Join Request for ${organization?.name}`,
          `
          <!DOCTYPE html>
          <html>
            <body style="background:#fff;margin:0;padding:0;">
              <div style="width:100%;padding:40px 0;background:#fff;">
                <table align="center" cellpadding="0" cellspacing="0" style="max-width:480px;margin:auto;background:#fff;border-radius:8px;">
                  <tr>
                    <td style="padding:0 24px;">
                      <h2 style="text-align:left;font-family:sans-serif;font-size:1.5rem;font-weight:600;margin-bottom:16px;color:#111;">
                        New Join Request for ${organization?.name}
                      </h2>
                      <p style="font-size:1rem;color:#111;text-align:left;margin-bottom:24px;">
                        <strong>${requesterName}</strong> has requested to join <strong>${organization?.name}</strong>.
                      </p>
                      ${message ? `<p style="font-size:1rem;color:#333;text-align:left;margin-bottom:24px;"> ${message}</p>` : ""}
                      <div style="text-align:center;margin-bottom:32px;">
                        <a href="${requestDetailsUrl}"
                          style="display:inline-block;background:#000;color:#fff;font-weight:600;text-decoration:none;padding:12px 0;width:100%;border-radius:4px;font-size:1rem;text-align:center;">
                          View Request Details
                        </a>
                      </div>
                      <p style="text-align:center;color:#444;margin-bottom:16px;font-size:0.95rem;">
                        If you have any questions, feel free to reach out to our support team at
                        <a href="mailto:support@complere.ai" style="color:#2186eb;text-decoration:none;">support@complere.ai</a>.
                      </p>
                      <p style="text-align:left;color:#aaa;font-size:0.9rem;">
                        If you didn't expect this request, you can safely ignore this email.
                      </p>
                      <hr style="border:none;border-top:1px solid #eee;margin:32px 0;">
                      <div style="text-align:center;color:#888;font-size:0.85rem;">
                        Copyright 2025 Complēre, LLC. All rights reserved.
                      </div>
                    </td>
                  </tr>
                </table>
              </div>
            </body>
          </html>
        `
        );
      }

      return { success: true, requestId: joinRequest.id };
    }),

  getJoinRequests: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().optional(),
        status: z.enum(["PENDING", "ACCEPTED", "REJECTED"]).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where: {
        type: "JOIN_REQUEST";
        organizationId?: string | { in: string[] };
        status?: "PENDING" | "ACCEPTED" | "REJECTED";
        user?: { id: string };
      } = {
        type: "JOIN_REQUEST",
      };

      if (input.organizationId) {
        await checkOrganizationAdmin(ctx.session.user.id, input.organizationId);
        where.organizationId = input.organizationId;
        if (input.status) where.status = input.status;
      } else {
        const adminMemberships = await db.member.findMany({
          where: {
            userId: ctx.session.user.id,
            role: "ADMIN",
          },
          select: {
            organizationId: true,
          },
        });

        const organizationIds = adminMemberships.map(membership => membership.organizationId);

        if (organizationIds.length === 0) {
          return [];
        }

        where.organizationId = { in: organizationIds };
        if (input.status) where.status = input.status;
      }

      const requests = await db.invitation.findMany({
        where,
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              location: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return requests.map((request: any) => ({
        id: request.id,
        email: request.email,
        message: request.message,
        status: request.status,
        createdAt: request.createdAt,
        expiresAt: request.expiresAt,
        organization: request.organization,
        user: request.user,
      }));
    }),

  getMyJoinRequests: protectedProcedure
    .input(
      z.object({
        status: z.enum(["PENDING", "ACCEPTED", "REJECTED"]).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where: {
        type: "JOIN_REQUEST";
        inviterId: string;
        status?: "PENDING" | "ACCEPTED" | "REJECTED";
      } = {
        type: "JOIN_REQUEST",
        inviterId: ctx.session.user.id,
      };

      if (input.status) where.status = input.status;

      const requests = await db.invitation.findMany({
        where,
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return requests.map((request: any) => ({
        id: request.id,
        email: request.email,
        message: request.message,
        status: request.status,
        createdAt: request.createdAt,
        expiresAt: request.expiresAt,
        organization: request.organization,
      }));
    }),

  cancelMyJoinRequest: protectedProcedure
    .input(
      z.object({
        requestId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { requestId } = input;

      const request = await db.invitation.findFirst({
        where: {
          id: requestId,
          type: "JOIN_REQUEST",
          inviterId: ctx.session.user.id, // Only allow users to cancel their own requests
          status: "PENDING", // Only allow canceling pending requests
        },
      });

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Join request not found or cannot be cancelled",
        });
      }

      // Delete the request
      await db.invitation.delete({
        where: {
          id: requestId,
        },
      });

      return { success: true };
    }),

  handleJoinRequest: protectedProcedure
    .input(
      z.object({
        requestId: z.string(),
        action: z.enum(["ACCEPT", "REJECT"]),
        role: z.enum(["ADMIN", "MEMBER", "VIEWER"]).optional().default("MEMBER"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { requestId, action, role } = input;

      const request = await db.invitation.findFirst({
        where: {
          id: requestId,
          type: "JOIN_REQUEST",
          status: "PENDING",
        },
        include: {
          user: true,
        },
      });

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Join request not found or already processed",
        });
      }

      await checkOrganizationAdmin(ctx.session.user.id, request.organizationId);

      if (action === "ACCEPT") {
        const organization = await db.organization.findFirst({
          where: { id: request.organizationId },
          select: {
            freeForever: true,
            trialEndsAt: true,
            subscriptions: {
              where: { status: { in: ["active", "canceled"] } },
              select: { seats: true },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        });

        if (!organization?.freeForever &&
          (!organization?.trialEndsAt || !isBefore(new Date(), organization.trialEndsAt))) {
          const activeSubscription = organization?.subscriptions[0];
          if (activeSubscription) {
            const currentMemberCount = await db.member.count({
              where: { organizationId: request.organizationId },
            });
            if (currentMemberCount >= activeSubscription.seats) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Organization has reached its seat limit",
              });
            }
          }
        }

        await db.$transaction([
          db.member.create({
            data: {
              organizationId: request.organizationId,
              userId: request.user.id,
              role,
              organizationEmail: request.email,
            },
          }),
          db.invitation.update({
            where: { id: requestId },
            data: { status: "ACCEPTED" },
          }),
        ]);

        return { success: true, action: "accepted" };
      } else {
        await db.invitation.update({
          where: { id: requestId },
          data: { status: "REJECTED" },
        });

        return { success: true, action: "rejected" };
      }
    }),

  // Admin: Approve organization pending verification
  adminApproveOrganization: adminProtectedProcedure
    .input(z.object({
      organizationId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { organizationId } = input;

      const organization = await db.organization.findFirst({
        where: { id: organizationId },
      });

      if (!organization) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found",
        });
      }

      return await db.organization.update({
        where: { id: organizationId },
        data: {
          verificationStatus: "VERIFIED",
          irsVerified: true,
        },
      });
    }),

  updateMemberRole: protectedProcedure
    .input(
      z.object({
        memberId: z.string(),
        role: z.enum(["ADMIN", "MEMBER", "VIEWER"]),
        organizationId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const organizationId = input.organizationId ?? ctx.session.session.activeOrganizationId;

      if (!organizationId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No organization specified",
        });
      }

      await checkOrganizationAdmin(ctx.session.user.id, organizationId);

      const member = await db.member.findFirst({
        where: {
          id: input.memberId,
          organizationId,
        },
      });

      if (!member) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found",
        });
      }

      if (member.userId === ctx.session.user.id && member.role === "ADMIN" && input.role !== "ADMIN") {
        const adminCount = await db.member.count({
          where: {
            organizationId,
            role: "ADMIN",
          },
        });

        if (adminCount === 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot remove admin role - organization must have at least one admin",
          });
        }
      }

      await db.member.update({
        where: { id: input.memberId },
        data: { role: input.role },
      });

      return { success: true };
    }),

  removeMember: protectedProcedure
    .input(
      z.object({
        memberId: z.string(),
        organizationId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const organizationId = input.organizationId ?? ctx.session.session.activeOrganizationId;

      if (!organizationId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No organization specified",
        });
      }

      await checkOrganizationAdmin(ctx.session.user.id, organizationId);

      const member = await db.member.findFirst({
        where: {
          id: input.memberId,
          organizationId,
        },
      });

      if (!member) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found",
        });
      }

      if (member.userId === ctx.session.user.id && member.role === "ADMIN") {
        const adminCount = await db.member.count({
          where: {
            organizationId,
            role: "ADMIN",
          },
        });

        if (adminCount === 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot remove the only admin from organization",
          });
        }
      }

      await db.$transaction([
        db.member.delete({
          where: { id: input.memberId },
        }),
        db.session.updateMany({
          where: {
            userId: member.userId,
            activeOrganizationId: organizationId,
          },
          data: {
            activeOrganizationId: null,
          },
        }),
      ]);

      return { success: true };
    }),

  checkDomain: publicProcedure
    .input(
      z.object({
        domain: z.string().min(1),
      }),
    )
    .query(async ({ input }) => {
      const domain = input.domain.toLowerCase();

      const domainRecord = await db.domain.findFirst({
        where: { domain },
        include: { organization: true },
      });

      if (domainRecord) {
        return {
          hasExistingDomain: true,
          domain,
          organization: {
            id: domainRecord.organization.id,
            name: domainRecord.organization.name,
          },
        };
      }
      return {
        hasExistingDomain: false,
        domain,
        organization: null,
      };
    }),

  checkExistingDomain: protectedProcedure.query(async ({ ctx }) => {
    const email = ctx.session.user.email;
    if (!email) {
      return { hasExistingDomain: false };
    }

    const emailData = getEmailData(email);

    if (emailData.type !== "private") {
      return { hasExistingDomain: false };
    }

    const existingDomain = await db.domain.findFirst({
      where: {
        domain: emailData.domain,
      },
      include: {
        organization: true,
      },
    });

    if (!existingDomain) {
      return { hasExistingDomain: false };
    }

    return {
      hasExistingDomain: true,
      organization: existingDomain.organization,
      domain: existingDomain.domain,
    };
  }),

  joinByEmailDomain: protectedProcedure.mutation(async ({ ctx }) => {
    const email = ctx.session.user.email;
    if (!email) {
      throw new Error("No email found");
    }

    const emailData = getEmailData(email);

    if (emailData.type !== "private") {
      throw new Error(
        "Only private email domains can join organizations automatically",
      );
    }

    const existingDomain = await db.domain.findFirst({
      where: {
        domain: emailData.domain,
      },
      include: {
        organization: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    isBetaUser: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!existingDomain) {
      throw new Error("No organization found with your email domain");
    }

    const hasBetaUsers = existingDomain.organization.members.some(
      (member: any) => member.user.isBetaUser,
    );

    // Check if user is already a member
    const existingMember = await db.member.findFirst({
      where: {
        userId: ctx.session.user.id,
        organizationId: existingDomain.organizationId,
      },
    });

    if (existingMember) {
      // Already a member, just update the active organization
      await db.session.update({
        where: { id: ctx.session.session.id },
        data: { activeOrganizationId: existingDomain.organizationId },
      });

      // If organization has beta users, grant beta access to this user too
      if (hasBetaUsers) {
        await db.user.update({
          where: { id: ctx.session.user.id },
          data: { isBetaUser: true },
        });
      }

      return {
        organization: existingDomain.organization,
        joined: false, // Already was a member
        grantedBetaAccess: hasBetaUsers,
      };
    }

    let userIsAllowedToJoin = existingDomain.organization.freeForever;
    if (!userIsAllowedToJoin) {
      const validSubscription = await db.subscription.findFirst({
        where: {
          status: { in: ["active", "canceled"] },
        },
      });
      if (validSubscription) {
        const membersAlreadyOnOrganization = await db.member.count({
          where: { organizationId: existingDomain.organizationId },
        });
        if (membersAlreadyOnOrganization + 1 <= validSubscription.seats) {
          userIsAllowedToJoin = true;
        }
      } else if (existingDomain.organization.trialEndsAt) {
        if (isBefore(new Date(), existingDomain.organization.trialEndsAt)) {
          userIsAllowedToJoin = true;
        }
      }
    }

    if (!userIsAllowedToJoin) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "The workspace's subscription does not have enough seats. Update your subscription to add more users.",
      });
    }

    // Create membership
    await db.member.create({
      data: {
        organizationId: existingDomain.organizationId,
        userId: ctx.session.user.id,
        role: "MEMBER",
        organizationEmail: email,
      },
    });

    // Clean up any pending invitations for this user's email to this organization
    if (email) {
      await db.invitation.updateMany({
        where: {
          email: email,
          organizationId: existingDomain.organizationId,
          status: "PENDING",
        },
        data: {
          status: "ACCEPTED",
        },
      });
    }

    // Update session to set active organization
    await db.session.update({
      where: { id: ctx.session.session.id },
      data: { activeOrganizationId: existingDomain.organizationId },
    });

    // If organization has beta users, grant beta access to this user too
    if (hasBetaUsers) {
      await db.user.update({
        where: { id: ctx.session.user.id },
        data: { isBetaUser: true },
      });
    }

    return {
      organization: existingDomain.organization,
      joined: true,
      grantedBetaAccess: hasBetaUsers,
    };
  }),

  // Get domains for an organization
  getDomains: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input: { organizationId } }) => {
      if (!organizationId) {
        throw new Error("No organization id found");
      }

      await checkOrganizationMember(ctx.session.user.id, organizationId);

      const domains = await db.domain.findMany({
        where: {
          organizationId,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      // Check which domains can be removed by this user
      const userEmail = ctx.session.user.email;
      const userEmailData = userEmail ? getEmailData(userEmail) : null;

      return {
        domains: domains.map((domain: any) => ({
          domain: domain.domain,
          canRemove: userEmailData?.domain === domain.domain,
        })),
      };
    }),

  // Get domain that can be added for current user
  getCanBeAddedDomain: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input: { organizationId } }) => {
      if (!organizationId) {
        throw new Error("No organization id found");
      }

      await checkOrganizationMember(ctx.session.user.id, organizationId);

      const email = ctx.session.user.email;
      if (!email) {
        throw new Error("No email found");
      }

      const emailData = getEmailData(email);

      if (emailData.type !== "private") {
        return { domain: null };
      }

      // Check if domain already exists (globally unique)
      const existingDomain = await db.domain.findFirst({
        where: {
          domain: emailData.domain,
        },
      });

      if (existingDomain) {
        return { domain: null };
      }

      return { domain: emailData.domain };
    }),

  // Add domain to organization
  addDomain: protectedProcedure
    .input(
      z.object({
        domain: z.string(),
        organizationId: z.string().optional(),
      }),
    )
    .mutation(async ({ input: { domain, organizationId }, ctx }) => {
      if (!organizationId) {
        throw new Error("No organization id found");
      }

      await checkOrganizationMember(ctx.session.user.id, organizationId);

      const organization = await db.organization.findFirst({
        where: {
          id: organizationId,
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!organization) {
        throw new Error("No organization found");
      }

      // Check if domain already exists (globally unique)
      const existingDomain = await db.domain.findFirst({
        where: {
          domain,
        },
      });

      if (existingDomain) {
        throw new Error("Domain already exists");
      }

      // Verify that at least one member has this domain
      const hasUserWithDomain = organization.members.some((member) => {
        if (!member.user.email) {
          return false;
        }
        return getEmailData(member.user.email).domain === domain;
      });

      if (!hasUserWithDomain) {
        throw new Error("No users in the organization with that domain found");
      }

      // Create the domain
      const newDomain = await db.domain.create({
        data: {
          organizationId,
          domain,
        },
      });

      return { organization, domain: newDomain.domain };
    }),

  // Remove domain from organization
  removeDomain: protectedProcedure
    .input(
      z.object({
        domain: z.string(),
        organizationId: z.string().optional(),
      }),
    )
    .mutation(async ({ input: { domain, organizationId }, ctx }) => {
      if (!organizationId) {
        throw new Error("No organization id found");
      }

      await checkOrganizationMember(ctx.session.user.id, organizationId);

      // Check if user's email domain matches the domain they're trying to remove
      const email = ctx.session.user.email;
      const emailData = email ? getEmailData(email) : null;
      if (emailData?.domain !== domain) {
        throw new Error("Domain does not match user's email domain");
      }

      const organization = await db.organization.findFirst({
        where: {
          id: organizationId,
        },
        select: {
          id: true,
          name: true,
        },
      });

      if (!organization) {
        throw new Error("No organization found");
      }

      // Check if domain exists for this organization
      const existingDomain = await db.domain.findFirst({
        where: {
          organizationId,
          domain,
        },
      });

      if (!existingDomain) {
        throw new Error("Domain does not exist in this organization");
      }

      // Remove the domain
      await db.domain.delete({
        where: {
          id: existingDomain.id,
        },
      });

      return { organization, domain };
    }),

  // List members of an organization
  listMembers: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().optional(),
        includeStats: z.boolean().default(false)
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const targetOrganizationId = input?.organizationId ?? ctx.session.session.activeOrganizationId;

      if (!targetOrganizationId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No organization specified. Please select an organization first.",
        });
      }

      await checkOrganizationMember(ctx.session.user.id, targetOrganizationId);

      const organization = await db.organization.findFirst({
        where: {
          id: targetOrganizationId,
        },
        include: {
          members: {
            where: {
              deletedAt: null,
              user: {
                deletedAt: null,
              },
            },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    createdAt: true,
                    ...(input?.includeStats && {
                      _count: {
                        select: {
                          chats: {
                            where: { organizationId: targetOrganizationId, deletedAt: null } 
                          },
                          workspaceDocuments: {
                            where: { organizationId: targetOrganizationId, deletedAt: null }
                          }
                        }
                      }
                    })
                  },
                },
              },
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        });

      if (!organization) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found",
        });
      }

      if (!input?.includeStats) {
        return organization.members.map((member) => ({
          id: member.id,
          role: member.role,
          createdAt: member.createdAt,
          organizationEmail: member.organizationEmail,
          user: {
            id: member.user.id,
            name: member.user.name,
            email: member.user.email,
            image: member.user.image,
          },
        }));
      }

      // Include stats
      return organization.members.map((member) => ({
        id: member.id,
        role: member.role,
        createdAt: member.createdAt,
        organizationEmail: member.organizationEmail,
        user: {
          id: member.user.id,
          name: member.user.name,
          email: member.user.email,
          image: member.user.image,
        },
        chatCount: member.user._count?.chats || 0,
        documentsUploaded: member.user._count?.workspaceDocuments || 0,
      }));
    }),

  // Invite users to organization (using better-auth invitation system)
  inviteUsers: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().optional(),
        emails: z.array(z.string().email()),
      }),
    )
    .mutation(async ({ ctx, input: { organizationId, emails } }) => {
      if (!organizationId) {
        throw new Error("No organization id found");
      }

      await checkOrganizationMember(ctx.session.user.id, organizationId);

      const organization = await db.organization.findFirst({
        where: {
          id: organizationId,
        },
        select: {
          id: true,
          name: true,
        },
      });

      if (!organization) {
        throw new Error("No organization found");
      }

      let successCount = 0;
      const errors: string[] = [];

      for (const email of emails) {
        try {
          // Check if user already exists and is a member
          const existingUser = await db.user.findFirst({
            where: { email },
            include: {
              members: {
                where: { organizationId },
              },
            },
          });

          if (existingUser && existingUser.members.length > 0) {
            errors.push(`${email} is already a member of this organization`);
            continue;
          }

          const token = crypto.randomBytes(32).toString("hex");
          await db.invitation.create({
            data: {
              organizationId,
              email,
              role: "MEMBER",
              status: "PENDING",
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
              inviterId: ctx.session.user.id,
              token,
            },
          });

          successCount++;
        } catch (error) {
          console.error(`Failed to invite ${email}:`, error);
          errors.push(`Failed to invite ${email}`);
        }
      }

      return {
        count: successCount,
        errors,
        organization,
      };
    }),

  // List all organizations (admin only)
  listAdmin: adminProtectedProcedure.query(async () => {
    return db.organization.findMany({
      include: {
        members: {
          include: {
            user: true,
          },
        },
        domains: true,
        subscriptions: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }),

  // Change user's organization memberships (admin only)
  changeUserOrganizations: adminProtectedProcedure
    .input(
      z.object({
        userId: z.string(),
        organizationIds: z.array(z.string()),
        role: z.enum(["ADMIN", "MEMBER", "VIEWER"]).default("MEMBER"),
      }),
    )
    .mutation(async ({ input }) => {
      const { userId, organizationIds, role } = input;

      const user = await db.user.findFirst({
        where: { id: userId },
        select: { email: true },
      });

      // Remove all existing memberships for this user
      await db.member.deleteMany({
        where: {
          userId,
        },
      });

      // Add new memberships
      if (organizationIds.length > 0) {
        await db.member.createMany({
          data: organizationIds.map((organizationId) => ({
            userId,
            organizationId,
            role,
            organizationEmail: user?.email ?? undefined,
          })),
        });
      }

      return { success: true };
    }),

  // Toggle free forever status for organization (admin only)
  toggleFreeForever: adminProtectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const { organizationId } = input;

      const org = await db.organization.findFirstOrThrow({
        where: { id: organizationId },
      });

      return db.organization.update({
        where: { id: organizationId },
        data: { freeForever: !org.freeForever },
      });
    }),

  // Admin: Get available domains that can be added to organization
  adminGetAvailableDomains: adminProtectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const { organizationId } = input;

      // Get organization with members and existing domains
      const organization = await db.organization.findFirst({
        where: {
          id: organizationId,
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  email: true,
                  emailVerified: true,
                },
              },
            },
          },
          domains: true,
        },
      });

      if (!organization) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found",
        });
      }

      // Get all domains from verified users in this organization
      const verifiedUserDomains = new Set<string>();
      organization.members.forEach((member) => {
        if (member.user.email && member.user.emailVerified) {
          const emailData = getEmailData(member.user.email);
          if (emailData.type === "private") {
            verifiedUserDomains.add(emailData.domain);
          }
        }
      });

      // Get existing domains in the organization
      const existingDomains = new Set(
        organization.domains.map((d) => d.domain),
      );

      // Get all existing domains globally to check conflicts
      const allExistingDomains = await db.domain.findMany({
        select: { domain: true },
      });
      const globallyExistingDomains = new Set(
        allExistingDomains.map((d) => d.domain),
      );

      // Filter available domains (verified user domains that aren't already added anywhere)
      const availableDomains = Array.from(verifiedUserDomains).filter(
        (domain) => !globallyExistingDomains.has(domain),
      );

      return {
        availableDomains: availableDomains.map((domain) => ({
          domain,
          isAlreadyAdded: existingDomains.has(domain),
        })),
      };
    }),

  // Admin: Add domain to organization
  adminAddDomain: adminProtectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        domain: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const { organizationId, domain } = input;

      // Check if organization exists
      const organization = await db.organization.findFirst({
        where: {
          id: organizationId,
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  email: true,
                  emailVerified: true,
                },
              },
            },
          },
        },
      });

      if (!organization) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found",
        });
      }

      // Check if domain already exists (globally unique)
      const existingDomain = await db.domain.findFirst({
        where: {
          domain,
        },
      });

      if (existingDomain) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Domain already exists",
        });
      }

      // Verify that at least one member has this domain with verified email
      const hasVerifiedUserWithDomain = organization.members.some((member) => {
        if (!member.user.email || !member.user.emailVerified) {
          return false;
        }
        return getEmailData(member.user.email).domain === domain;
      });

      if (!hasVerifiedUserWithDomain) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "No verified users in the organization with that domain found",
        });
      }

      // Create the domain
      const newDomain = await db.domain.create({
        data: {
          organizationId,
          domain,
        },
      });

      return { domain: newDomain };
    }),

  // Admin: Delete domain from organization
  adminDeleteDomain: adminProtectedProcedure
    .input(
      z.object({
        domainId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const { domainId } = input;

      // Check if domain exists
      const domain = await db.domain.findFirst({
        where: {
          id: domainId,
        },
      });

      if (!domain) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Domain not found",
        });
      }

      // Delete the domain
      await db.domain.delete({
        where: {
          id: domainId,
        },
      });

      return { success: true };
    }),

  // Admin: List all users for organization management
  adminListUsersForOrganization: adminProtectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const { organizationId } = input;

      // Get all users with their organization membership info
      const users = await db.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          members: {
            where: {
              organizationId,
            },
            select: {
              id: true,
              role: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      });

      return users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        isMember: user.members.length > 0,
        membership: user.members[0] || null,
      }));
    }),

  // Admin: Change organization members (add/remove users from organization)
  adminChangeOrganizationMembers: adminProtectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        userIds: z.array(z.string()),
        role: z.enum(["ADMIN", "MEMBER", "VIEWER"]).default("MEMBER"),
      }),
    )
    .mutation(async ({ input }) => {
      const { organizationId, userIds, role } = input;

      const users = await db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true },
      });
      const userEmailMap = new Map(users.map((u) => [u.id, u.email]));

      // Remove all existing memberships for this organization
      await db.member.deleteMany({
        where: {
          organizationId,
        },
      });

      // Add new memberships
      if (userIds.length > 0) {
        await db.member.createMany({
          data: userIds.map((userId) => ({
            userId,
            organizationId,
            role,
            organizationEmail: userEmailMap.get(userId) ?? undefined,
          })),
        });
      }

      return { success: true };
    }),

  // Extend trial by specified weeks from now (admin only)
  extendTrial: adminProtectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        weeks: z.number().min(1).max(52).default(4),
      }),
    )
    .mutation(async ({ input }) => {
      const { organizationId, weeks } = input;

      // Set trial end date to specified weeks from now
      const newTrialEndDate = addWeeks(new Date(), weeks);

      return db.organization.update({
        where: { id: organizationId },
        data: { trialEndsAt: newTrialEndDate },
      });
    }),

  // Update trial chat count for organization (admin only)
  updateTrialChatCount: adminProtectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        trialChatCount: z.number().min(1).max(1000),
      }),
    )
    .mutation(async ({ input }) => {
      const { organizationId, trialChatCount } = input;

      return db.organization.update({
        where: { id: organizationId },
        data: { trialChatCount },
      });
    }),

  // Get current chat count for organization (admin or organization Admin only)
  getOrganizationChatCount: orgOrAdminProtectedProcedure
    .input(
      z.object({
        organizationId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const organizationId = input.organizationId ?? ctx.session.session.activeOrganizationId;
      if (!organizationId) {
        throw new Error("Organization ID is required");
      }
      return await getOrganizationChatCount(organizationId);
    }),

  getOrganizationProfile: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const organizationId = input.organizationId ?? ctx.session.session.activeOrganizationId;

      if (!organizationId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No organization specified",
        });
      }

      // Check if user is a member first before checking admin status
      const member = await db.member.findFirst({
        where: {
          userId: ctx.session.user.id,
          organizationId,
        },
      });

      // If user is not a member at all, throw NOT_FOUND instead of FORBIDDEN
      if (!member) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found or you are not a member",
        });
      }

      // Now check if they're an admin
      if (member.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must be an admin to access this organization profile",
        });
      }

      const organization = await db.organization.findFirst({
        where: { id: organizationId },
        include: {
          members: {
            where: { role: "ADMIN" },
            include: {
              user: {
                select: {
                  email: true,
                  location: true,
                },
              },
            },
            take: 1,
          },
          _count: {
            select: {
              members: true,
              chats: true,
              workspaceDocuments: true,
              subscriptions: {
                where: {
                  status: { in: ["active", "canceled"] },
                },
              },
            },
          },
        },
      });

      if (!organization) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found",
        });
      }

      let irsData = null;
      if (organization.irsEin) {
        irsData = await db.irsOrganizationData.findUnique({
          where: { ein: organization.irsEin },
        });
      }

      const admin = organization.members[0];

      return {
        id: organization.id,
        name: organization.name,
        domain: organization.domain,
        logo: organization.logo,
        adminEmail: admin?.user.email,
        adminLocation: admin?.user.location,
        irsVerified: organization.irsVerified,
        irsEin: organization.irsEin,
        irsSubsectionCode: organization.irsSubsectionCode,
        irsExemptionStatus: organization.irsExemptionStatus,
        irsOrganizationName: organization.irsOrganizationName,
        irsTaxPeriod: organization.irsTaxPeriod,
        irsVerifiedAt: organization.irsVerifiedAt,
        verificationStatus: organization.verificationStatus,
        financialData: irsData ? {
          totalAssets: irsData.assetAmount,
          totalIncome: irsData.incomeAmount,
          totalRevenue: irsData.revenueAmount,
        } : null,
        metrics: {
          activeSubscriptions: organization._count.subscriptions,
          totalChats: organization._count.chats,
          workspaceDocuments: organization._count.workspaceDocuments,
          members: organization._count.members,
        },
      };
    }),

  updateOrganizationProfile: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().optional(),
        name: z.string().min(1).optional(),
        logo: z.string().url().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const organizationId = input.organizationId ?? ctx.session.session.activeOrganizationId;

      if (!organizationId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No organization specified",
        });
      }

      await checkOrganizationAdmin(ctx.session.user.id, organizationId);

      const updated = await db.organization.update({
        where: { id: organizationId },
        data: {
          ...(input.name !== undefined && { name: input.name }),
          ...(input.logo !== undefined && { logo: input.logo }),
        },
      });

      return {
        success: true,
        organization: updated,
      };
    }),
});