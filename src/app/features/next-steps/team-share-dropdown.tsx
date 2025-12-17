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
          isBetaUser: true, // Set to true so user can access the app
          emailVerified: false,
        },
      });

      const acceptedOrganizationId = await autoAcceptPendingInvitations(newUser.id, email);

      // If user wants to join an existing organization, create a join request
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
          // Don't fail registration if join request fails
        }
      }
      // Create new organization if provided (Scenario 1) - but only if user wasn't already added to an organization via invitation
      else if (organization && organization.name && !acceptedOrganizationId) {
        try {
          const newOrg = await db.organization.create({
            data: {
              name: organization.name,
              domain: organization.url,
              trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
            },
          });

          // Make user an admin of their organization
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
            // If membership creation fails due to unique constraint, user might already be a member
            // This is okay, we'll just continue
          }

          // Add domain if provided and valid
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

          console.log(`✅ Created organization "${organization.name}" for user ${email}`);
        } catch (error) {
          console.error("Failed to create organization:", error);
          // Don't fail registration if organization creation fails
        }
      }

      return { success: true, userId: newUser.id };
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
});