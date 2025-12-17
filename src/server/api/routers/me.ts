import { db } from "@/server/db";
import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import { getEmailData } from "@/lib/utils/email";
import { addDays } from "date-fns";
import { autoAcceptPendingInvitations } from "@/lib/auth";
import { PERSONAL_WORKSPACE_LABEL } from "@/lib/workspace";

export const meRouter = createTRPCRouter({
  get: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user) {
      return null;
    }

    const user = await db.user.findFirstOrThrow({
      where: {
        id: ctx.session.user.id,
      },
      include: {
        members: {
          include: {
            organization: true,
          },
        },
      },
    });

    const organizations = await Promise.all(
      user.members.map(async (member) => {
        const memberCount = await db.member.count({
          where: { organizationId: member.organization.id },
        });

        return {
          ...member.organization,
          isActive:
            member.organization.id ===
            ctx.session?.session?.activeOrganizationId,
          role: member.role,
          memberCount,
        };
      })
    );

    const personalWorkspace = {
      id: null as any,
      name: PERSONAL_WORKSPACE_LABEL,
      slug: null,
      logo: user.image,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      metadata: null,
      domain: null,
      freeForever: true,
      trialEndsAt: null,
      trialChatCount: 999999, 
      isActive: !ctx.session?.session?.activeOrganizationId,
      role: "ADMIN" as const,
      memberCount: 1,
      isUSBased: false,
      irsVerified: false,
      irsEin: null,
      irsSubsectionCode: null,
      irsExemptionStatus: null,
      irsOrganizationName: null,
      irsTaxPeriod: null,
      irsVerifiedAt: null,
      verificationStatus: "NOT_CHECKED" as const,
    };

    const allWorkspaces = [personalWorkspace, ...organizations];

    const activeOrganization = allWorkspaces.find(
      (workspace) =>
        workspace.id === ctx.session?.session?.activeOrganizationId,
    ) || personalWorkspace;

    const activeOrganizationMember = user.members.find(
      (member) => member.organizationId === ctx.session?.session?.activeOrganizationId,
    );

    return {
      ...user,
      activeOrganization,
      activeOrganizationMember: activeOrganizationMember ? {
        id: activeOrganizationMember.id,
        role: activeOrganizationMember.role,
        organizationId: activeOrganizationMember.organizationId,
      } : null,
      organizations: allWorkspaces,
    };
  }),

  update: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        firstName: z.string().optional(),
        location: z.string().optional(),
        interests: z.array(z.string()).optional(),
        aiUsage: z.string().optional(),
        url: z.string().optional(),

        organization: z
          .object({
            name: z.string().optional(),
          })
          .optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { organization, ...userData } = input;

      let invitedOrganizationId: string | null = null;
      if (ctx.session.user.email) {
        const autoAcceptResult = await autoAcceptPendingInvitations(
          ctx.session.user.id,
          ctx.session.user.email,
        );
        invitedOrganizationId = autoAcceptResult.acceptedOrganizationId;
      }

      const user = await db.user.update({
        where: { id: ctx.session.user.id },
        data: { ...userData },
        include: {
          members: {
            include: {
              organization: true,
            },
          },
        },
      });
      const organizations = user.members.map((member) => {
        return {
          ...member.organization,
          isActive:
            member.organization.id === ctx.session.session.activeOrganizationId,
        };
      });

      const activeOrganization = organizations.find((org) => org.isActive);

      if (invitedOrganizationId && !activeOrganization) {
        await db.session.update({
          where: { id: ctx.session.session.id },
          data: { activeOrganizationId: invitedOrganizationId },
        });
      }
      else if (activeOrganization && organization) {
        await db.organization.update({
          where: { id: activeOrganization.id },
          data: { name: organization.name },
        });
      }
      else if (organization && !invitedOrganizationId) {
        const existingMemberships = await db.member.findMany({
          where: { userId: ctx.session.user.id },
          include: { organization: true },
        });

        if (existingMemberships.length === 0) {
          const org = await db.organization.create({
            data: {
              name: organization.name ?? `${user.name}'s Org`,
              trialEndsAt: addDays(new Date(), 14),
            },
          });

          await db.member.create({
            data: {
              organizationId: org.id,
              userId: ctx.session.user.id,
              organizationEmail: user.email ?? undefined,
              role: "ADMIN",
            },
          });

          if (user.email) {
            const emailData = getEmailData(user.email);

            if (emailData.type === "private") {
              const existingDomain = await db.domain.findFirst({
                where: {
                  domain: emailData.domain,
                },
              });

              if (!existingDomain) {
                await db.domain.create({
                  data: {
                    organizationId: org.id,
                    domain: emailData.domain,
                  },
                });
              }
            }
          }

          const session = await db.session.findFirstOrThrow({
            where: {
              id: ctx.session.session.id,
            },
          });

          await db.session.update({
            where: { id: session.id },
            data: { activeOrganizationId: org.id },
          });
        }
      }

      return user;
    }),

  updateNotifications: protectedProcedure
    .input(
      z.object({
        marketingEmails: z.boolean(),
        productUpdates: z.boolean(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { marketingEmails, productUpdates } = input;

      await db.user.update({
        where: { id: ctx.session.user.id },
        data: { marketingEmails, productUpdates },
      });
    }),

  updateUserImage: protectedProcedure
    .input(
      z.object({
        image: z.string().url().nullable(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await db.user.update({
        where: { id: ctx.session.user.id },
        data: { image: input.image },
      });

      return { success: true };
    }),

  setActiveOrganization: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().nullable(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { organizationId } = input;

      if (organizationId !== null) {
        const member = await db.member.findFirst({
          where: {
            userId: ctx.session.user.id,
            organizationId,
          },
        });

        if (!member) {
          throw new Error("You are not a member of this organization");
        }
      }

      await db.session.update({
        where: { id: ctx.session.session.id },
        data: { activeOrganizationId: organizationId },
      });

      return { success: true };
    }),
});