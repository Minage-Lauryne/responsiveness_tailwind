import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createEmailLinkVerification,
  findUserByAnyEmail,
  getUserEmails,
  linkEmailToUser,
  verifyEmailLinkCode,
  setPrimaryEmail,
} from "@/lib/user-emails";

export const userEmailsRouter = createTRPCRouter({
  /**
   * Request to link a new email to the user's account
   * Sends a verification code to the email
   */
  requestLinkEmail: protectedProcedure
    .input(
      z.object({
        email: z.string().email("Please enter a valid email address"),
        invitationId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const existingUser = await findUserByAnyEmail(input.email);
      if (existingUser) {
        if (existingUser.id === userId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This email is already linked to your account",
          });
        } else {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "This email is already linked to another account. Please sign in with that account instead.",
          });
        }
      }

      if (input.invitationId) {
        const invitation = await db.invitation.findFirst({
          where: {
            id: input.invitationId,
            email: input.email,
            status: "PENDING",
            expiresAt: {
              gt: new Date(),
            },
          },
        });

        if (!invitation) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid or expired invitation",
          });
        }
      }

      const code = await createEmailLinkVerification(input.email);

      try {
        const { getEmailLinkVerificationParams } = await import(
          "@/services/email/templates/user/email-link-verification-template"
        );
        const { sendMail } = await import("@/services/email/resend");

        await sendMail(
          getEmailLinkVerificationParams,
          input.email,
          ctx.session.user.name ?? "User",
          code,
        );
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send verification email",
        });
      }

      return {
        success: true,
        message: `Verification code sent to ${input.email}`,
      };
    }),

  /**
   * Verify the code and link the email to the user's account
   */
  verifyAndLinkEmail: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        code: z.string().length(6, "Code must be 6 digits"),
        invitationId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const verification = await verifyEmailLinkCode(input.email, input.code);
      if (!verification.valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: verification.error ?? "Invalid verification code",
        });
      }

      const linkResult = await linkEmailToUser(input.email, userId, true);
      if (!linkResult.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: linkResult.error ?? "Failed to link email",
        });
      }

      if (input.invitationId) {
        try {
          const invitation = await db.invitation.findFirst({
            where: {
              id: input.invitationId,
              email: input.email,
              status: "PENDING",
              expiresAt: {
                gt: new Date(),
              },
            },
          });

          if (invitation) {
            const existingMember = await db.member.findFirst({
              where: {
                userId,
                organizationId: invitation.organizationId,
              },
            });

            if (!existingMember) {
              await db.$transaction([
                db.member.create({
                  data: {
                    userId,
                    organizationId: invitation.organizationId,
                    role: invitation.role ?? "MEMBER",
                    organizationEmail: input.email,

                  },
                }),
                db.invitation.update({
                  where: { id: input.invitationId },
                  data: { status: "ACCEPTED" },
                }),
                db.session.updateMany({
                  where: { userId },
                  data: { activeOrganizationId: invitation.organizationId },
                }),
              ]);
            } else {
              await db.invitation.update({
                where: { id: input.invitationId },
                data: { status: "ACCEPTED" },
              });
            }
          }
        } catch (error) {
          console.error("Failed to accept invitation:", error);
        }
      }

      return {
        success: true,
        message: "Email linked successfully",
      };
    }),

  /**
   * Get all emails linked to the user's account
   */
  getMyEmails: protectedProcedure.query(async ({ ctx }) => {
    const emails = await getUserEmails(ctx.session.user.id);
    return { emails };
  }),

  /**
   * Set a linked email as the primary email
   */
  setPrimaryEmail: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await setPrimaryEmail(ctx.session.user.id, input.email);
      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error ?? "Failed to set primary email",
        });
      }
      return { success: true, message: "Primary email updated" };
    }),

  /**
   * Remove a linked email from the user's account
   */
  removeLinkedEmail: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const user = await db.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (user?.email === input.email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot remove your primary email",
        });
      }

      try {
        await db.userEmail.deleteMany({
          where: {
            userId,
            email: input.email,
          },
        });

        return { success: true, message: "Email removed successfully" };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to remove email",
        });
      }
    }),
});
