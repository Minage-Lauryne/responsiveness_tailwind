import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP, admin, organization } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { createAuthMiddleware } from "better-auth/api";
import { isBefore } from "date-fns";

import { db } from "@/server/db";
import { sendMail } from "@/services/email/resend";
import { getNewUserParams } from "@/services/email/templates/admin/new-user-template";
import { getAuthCodeParams } from "@/services/email/templates/user/auth-code-template";
import { env } from "@/create-env";

async function checkSeatAvailability(organizationId: string): Promise<boolean> {
  const organization = await db.organization.findFirst({
    where: { id: organizationId },
    select: {
      freeForever: true,
      trialEndsAt: true,
      subscriptions: {
        where: {
          status: { in: ["active", "canceled"] },
        },
        select: {
          seats: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });

  if (!organization) {
    return false;
  }

  if (organization.freeForever) {
    return true;
  }

  if (
    organization.trialEndsAt &&
    isBefore(new Date(), organization.trialEndsAt)
  ) {
    return true;
  }

  const activeSubscription = organization.subscriptions[0];
  if (activeSubscription) {
    const [currentMemberCount, pendingInvitationCount] = await Promise.all([
      db.member.count({ where: { organizationId } }),
      db.invitation.count({
        where: {
          organizationId,
          status: "PENDING",
        },
      }),
    ]);

    const totalPendingMembers = currentMemberCount + pendingInvitationCount;
    return totalPendingMembers < activeSubscription.seats;
  }

  return false;
}

export async function autoAcceptPendingInvitations(
  userId: string,
  email: string,
): Promise<{ acceptedOrganizationId: string | null; acceptedCount: number }> {
  try {
    const pendingInvitations = await db.invitation.findMany({
      where: {
        email: email,
        status: "PENDING",
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        organization: true,
      },
      orderBy: {
        createdAt: "desc", 
      },
    });

    let firstOrganizationId: string | null = null;
    let acceptedCount = 0;

    for (const invitation of pendingInvitations) {
      const existingMember = await db.member.findFirst({
        where: {
          userId,
          organizationId: invitation.organizationId,
        },
      });

      if (existingMember) {
        await db.invitation.update({
          where: { id: invitation.id },
          data: { status: "ACCEPTED" },
        });
        continue;
      }

      const hasAvailableSeats = await checkSeatAvailability(
        invitation.organizationId,
      );

      if (hasAvailableSeats) {
        try {
          await db.$transaction([
            db.member.create({
              data: {
                userId,
                organizationId: invitation.organizationId,
                organizationEmail: invitation.email,
                role: invitation.role ?? "MEMBER",
              },
            }),
            db.invitation.update({
              where: { id: invitation.id },
              data: { status: "ACCEPTED" },
            }),
          ]);

          if (!firstOrganizationId) {
            firstOrganizationId = invitation.organizationId;
          }
          acceptedCount++;

        } catch (error) {
          console.error(`Failed to create membership for ${email} in organization ${invitation.organization.name}:`, error);
          if (error instanceof Error && error.message.includes('unique constraint')) {
            await db.invitation.update({
              where: { id: invitation.id },
              data: { status: "ACCEPTED" },
            });
          }
        }
      }
    }

    return { acceptedOrganizationId: firstOrganizationId, acceptedCount };
  } catch (error) {
    console.error("Failed to auto-accept pending invitations:", error);
    return { acceptedOrganizationId: null, acceptedCount: 0 };
  }
}

export const auth = betterAuth({
  trustedOrigins: process.env.TRUSTED_ORIGINS?.split(",").map(url => url.trim()) || [],
  secret: env.BILLIAM_AUTH_SECRET,
  session: {
    modelName: "Session",
    expiresIn: 60 * 60 * 24 * 90,
  },
  account: { modelName: "Account" },
  verification: { modelName: "Verification" },
  organization: { modelName: "Organization" },
  member: { modelName: "Member" },
  invitation: { modelName: "Invitation" },
  user: {
    modelName: "User",
    additionalFields: {
      url: { type: "string" },
      isAdmin: { type: "boolean" },
      isBetaUser: { type: "boolean" },
    },
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      const newSession = ctx.context.newSession;
      if (newSession && !newSession.user.emailVerified) {
        await db.user.update({
          where: { id: newSession.user.id },
          data: { emailVerified: true },
        });
      }
    }),
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          try {
            const userMemberships = await db.member.findMany({
              where: { userId: session.userId },
              include: { organization: true },
              orderBy: { createdAt: "asc" },
            });

            const activeOrganizationId = userMemberships.length > 0 
              ? userMemberships[0]?.organizationId 
              : null;

            return {
              data: {
                ...session,
                activeOrganizationId,
              },
            };
          } catch (error) {
            console.error("Error setting active organization in session:", error);
            return {
              data: {
                ...session,
                activeOrganizationId: null,
              },
            };
          }
        },
      },
    },
    user: {
      create: {
        async after(user) {
          try {
            await sendMail(getNewUserParams, user.email);
          } catch (error) {
            console.error(
              "Failed to send admin notification for new user:",
              error,
            );
          }
        },
      },
    },
  },
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  plugins: [
    admin(),
    organization(),
    nextCookies(),
    emailOTP({
      allowedAttempts: 3,
      expiresIn: 300,
      async sendVerificationOTP({ email, otp, type }) {

        const existingUser = await db.user.findUnique({
          where: { email },
        });
    
        if (!existingUser) {
          throw new Error("This email is not registered. Please contact support@complere.ai for help");
        }
  
        if (env.NODE_ENV === "development") {
        }
    
        await sendMail(getAuthCodeParams, email, otp);
      },
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
