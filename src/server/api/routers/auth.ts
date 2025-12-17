import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { z } from "zod";
import { getEmailData } from "@/lib/utils/email";
import { auth, autoAcceptPendingInvitations } from "@/lib/auth";

export const authRouter = createTRPCRouter({
  sendCode: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      }),
    )
    .mutation(async ({ input: { email } }) => {
      const emailData = getEmailData(email);
      if (emailData.type === "temporary") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Temporary emails are not allowed" });
      }

      const user = await db.user.findUnique({ where: { email } });
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "This email is not registered. Please contact support@complere.ai for help",
        });
      }

      await auth.api.sendVerificationOTP({ body: { email, type: "sign-in" } });

      return { success: true, email, isBetaUser: !!user.isBetaUser };
    }),

  registerForBeta: publicProcedure
    .input(z.object({
      email: z.string().email(),
      fullName: z.string().min(1),
      firstName: z.string().min(1),
      location: z.string().min(1),
      aiUsage: z.string(),
      interests: z.array(z.string()).optional(),
      organization: z.object({
        name: z.string().optional(),
        url: z.string().optional(),
        isUSBased: z.boolean(),
        irsVerification: z.object({
          ein: z.string(),
          organizationName: z.string(),
          exemptionStatus: z.string(),
          subsection: z.string().optional(),
          taxPeriod: z.string().optional(),
          verificationStatus: z.enum(["VERIFIED", "NOT_FOUND", "SKIPPED", "INACTIVE"]),
        }).optional(),
      }).optional(),
      joinExistingOrganization: z.object({
        organizationId: z.string(),
        organizationName: z.string(),
      }).optional(),
    }))
    .mutation(async ({ input }) => {
      const { email, fullName, firstName, location, aiUsage, interests, organization, joinExistingOrganization } = input;

      const emailData = getEmailData(email);
      if (emailData.type === "temporary") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Temporary emails are not allowed" });
      }

      const existingUser = await db.user.findUnique({ where: { email } });
      if (existingUser) {
        throw new TRPCError({ code: "CONFLICT", message: "This email is already registered. Please sign in." });
      }

      const newUser = await db.user.create({
        data: {
          email,
          name: fullName,
          firstName,
          location,
          aiUsage,
          interests: interests ?? [],
          url: organization?.url ?? null,
          isBetaUser: true,
          emailVerified: false,
          hasCompletedOrgOnboarding: true,
        },
      });

      const result = await autoAcceptPendingInvitations(newUser.id, email);
      const acceptedOrganizationId = result.acceptedOrganizationId;
      const acceptedCount = result.acceptedCount;

      if (joinExistingOrganization) {
        try {
          await db.invitation.create({
            data: {
              organizationId: joinExistingOrganization.organizationId,
              email,
              role: "MEMBER",
              status: "PENDING",
              type: "JOIN_REQUEST",
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
              inviterId: newUser.id,
              message: `Registration request from ${fullName}`,
            },
          });
        } catch (error) {
          console.error("Failed to create join request:", error);
        }
      }
      else if (organization?.name && !acceptedOrganizationId) {
        try {
          const shouldBlockCreation = organization.irsVerification?.verificationStatus === "INACTIVE";
          
          const newOrg = await db.organization.create({
            data: {
              name: organization.name,
              domain: organization.url,
              trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
              isUSBased: organization.isUSBased,
              ...(organization.irsVerification && {
                irsEin: organization.irsVerification.ein,
                irsOrganizationName: organization.irsVerification.organizationName,
                irsExemptionStatus: organization.irsVerification.exemptionStatus,
                irsSubsectionCode: organization.irsVerification.subsection,
                irsTaxPeriod: organization.irsVerification.taxPeriod,
                irsVerified: organization.irsVerification.verificationStatus === "VERIFIED",
                verificationStatus: shouldBlockCreation ? "PENDING_ADMIN" : organization.irsVerification.verificationStatus,
                irsVerifiedAt: new Date(),
              }),
            },
          });

          // Only create membership if not blocked
          if (!shouldBlockCreation) {
            try {
              await db.member.create({
                data: {
                  organizationId: newOrg.id,
                  organizationEmail: email,
                  userId: newUser.id,
                  role: "ADMIN",
                },
              });
            } catch (error) {
              console.error("Failed to create admin membership:", error);
            }
          } else {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "This organization's tax-exempt status appears to be inactive or revoked. An administrator will review your request. You can still sign in, and we'll contact you once the review is complete.",
            });
          }

          if (organization.url && emailData.type === "private" && emailData.domain === organization.url) {
            const existingDomain = await db.domain.findFirst({
              where: { domain: organization.url },
            });

            if (!existingDomain) {
              await db.domain.create({
                data: {
                  organizationId: newOrg.id,
                  domain: organization.url,
                },
              });
            }
          }

          console.log(`Created organization "${organization.name}" for user ${email}`);
        } catch (error) {
          console.error("Failed to create organization:", error);
        }
      }

      return { 
        success: true, 
        userId: newUser.id,
        acceptedInvitations: acceptedCount || 0,
      };
    }),

    checkEmailExists: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input: { email } }) => {
      const user = await db.user.findUnique({
        where: { email: email.toLowerCase() },
        select: { id: true }, 
      });
      return { exists: !!user };
    }),

  verifyExistingAccountCode: publicProcedure
    .input(z.object({
      userId: z.string(),
      existingEmail: z.string().email(),
      invitedEmail: z.string().email().optional(),
      code: z.string().length(6),
      invitationId: z.string().optional(),
    }))
    .mutation(async ({ input: { userId, existingEmail, invitedEmail, code, invitationId } }) => {
      try {
        const allVerifications = await db.verification.findMany({
          where: {
            identifier: {
              contains: existingEmail,
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
        });

        console.log(`[DEBUG] Looking for verification code for ${existingEmail}`);
        console.log(`[DEBUG] Found ${allVerifications.length} verifications containing this email:`);
        allVerifications.forEach(v => {
          console.log(`  - identifier: "${v.identifier}", value: "${v.value}", expires: ${v.expiresAt}, created: ${v.createdAt}`);
        });

        const possibleIdentifiers = [
          existingEmail,                    // Plain email
          `email-otp:${existingEmail}`,     // Format: email-otp:{email}
          `otp:${existingEmail}`,           // Format: otp:{email}
          `sign-in:${existingEmail}`,       // Format: {type}:{email}
          `sign-in-otp-${existingEmail}`,   // Format: sign-in-otp-{email}
        ];

        let verification = null;
        let usedIdentifier = "";

        for (const identifier of possibleIdentifiers) {
          verification = await db.verification.findFirst({
            where: {
              identifier,
              value: code,
              expiresAt: {
                gt: new Date(),
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          });

          if (!verification) {
            verification = await db.verification.findFirst({
              where: {
                identifier,
                value: {
                  startsWith: `${code}:`,
                },
                expiresAt: {
                  gt: new Date(),
                },
              },
              orderBy: {
                createdAt: "desc",
              },
            });
          }

          if (verification) {
            usedIdentifier = identifier;
            break;
          }
        }

        if (!verification) {
          console.log(`[DEBUG] No matching verification found for any identifier format with code="${code}"`);
          console.log(`[DEBUG] Tried identifiers:`, possibleIdentifiers);
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid or expired verification code",
          });
        }

        console.log(`[DEBUG] Verification successful using identifier="${usedIdentifier}", deleting code`);
        await db.verification.delete({
          where: { id: verification.id },
        });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("[DEBUG] Unexpected error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to verify code",
        });
      }
    }),

  linkExistingAccountToInvitation: publicProcedure
    .input(z.object({
      existingEmail: z.string().email(),
      invitedEmail: z.string().email(),
      invitationId: z.string(),
    }))
    .mutation(async ({ input: { existingEmail, invitedEmail, invitationId } }) => {
      const invitation = await db.invitation.findFirst({
        where: {
          id: invitationId,
          email: invitedEmail,
          status: "PENDING",
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid or expired invitation",
        });
      }

      const existingUser = await db.user.findUnique({
        where: { email: existingEmail },
        select: { id: true, isBetaUser: true },
      });

      if (!existingUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No account found with this email address.",
        });
      }

      await auth.api.sendVerificationOTP({ 
        body: { email: existingEmail, type: "sign-in" } 
      });

      return {
        success: true,
        userId: existingUser.id,
      };
    }),

  linkInvitedEmailAndAcceptInvitation: publicProcedure
    .input(z.object({
      userId: z.string(),
      existingEmail: z.string().email(),
      invitedEmail: z.string().email(),
      invitationId: z.string(),
    }))
    .mutation(async ({ input: { userId, existingEmail, invitedEmail, invitationId } }) => {

      const existingUser = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true },
      });

      if (!existingUser || existingUser.email !== existingEmail) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Existing user not found",
        });
      }

      const existingUserEmail = await db.userEmail.findFirst({
        where: { email: invitedEmail },
      });

      if (existingUserEmail) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This email is already linked to an account",
        });
      }

      try {
        await db.userEmail.create({
          data: {
            userId: existingUser.id,
            email: invitedEmail,
            verified: true,
            isPrimary: false,
          },
        });

        await autoAcceptPendingInvitations(existingUser.id, invitedEmail);

        return { success: true };
      } catch (error) {
        console.error("Failed to link invited email and accept invitation:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to link accounts. Please try again.",
        });
      }
    }),

  validateSession: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
    }))
    .query(async ({ input: { sessionToken } }) => {
      const session = await db.session.findUnique({
        where: { token: sessionToken },
        select: {
          id: true,
          userId: true,
          expiresAt: true,
          activeOrganizationId: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              firstName: true,
              isAdmin: true,
            },
          },
        },
      });

      if (!session || session.expiresAt < new Date()) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid or expired session",
        });
      }

      if (!session.activeOrganizationId) {
        return {
          valid: true,
          workspace: {
            type: "personal" as const,
          },
          user: {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            firstName: session.user.firstName,
            isAdmin: session.user.isAdmin,
          },
        };
      }

      const membership = await db.member.findUnique({
        where: {
          userId_organizationId: {
            userId: session.userId,
            organizationId: session.activeOrganizationId,
          },
        },
        select: {
          role: true,
          organizationEmail: true,
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              irsVerified: true,
              irsEin: true,
              isUSBased: true,
            },
          },
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "User is not a member of the active organization",
        });
      }

      return {
        valid: true,
        workspace: {
          type: "organization" as const,
        },
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          firstName: session.user.firstName,
          isAdmin: session.user.isAdmin,
        },
        organization: {
          id: membership.organization.id,
          name: membership.organization.name,
          slug: membership.organization.slug,
          irsVerified: membership.organization.irsVerified,
          irsEin: membership.organization.irsEin,
          isUSBased: membership.organization.isUSBased,
        },
        membership: {
          role: membership.role,
          organizationEmail: membership.organizationEmail,
        },
      };
    }),
});