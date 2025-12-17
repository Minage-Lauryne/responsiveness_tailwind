import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { z } from "zod";

export const invitationRouter = createTRPCRouter({
  getInvitationDetails: publicProcedure
    .input(z.object({ invitationId: z.string() }))
    .query(async ({ input: { invitationId } }) => {
      const invitation = await db.invitation.findFirst({
        where: {
          id: invitationId,
          type: "INVITATION",
          status: "PENDING",
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          organization: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid or expired invitation",
        });
      }

      return {
        email: invitation.email,
        organizationName: invitation.organization.name,
      };
    }),

  findPendingInvitations: publicProcedure
    .input(z.object({ email: z.string() }))
    .query(async ({ input: { email } }) => {
      const invitations = await db.invitation.findMany({
        where: {
          email: email.toLowerCase(),
          status: "PENDING",
          type: "INVITATION",
          expiresAt: {
            gt: new Date(),
          },
        },
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

      return invitations;
    }),
});