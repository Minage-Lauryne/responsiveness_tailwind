import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const newsletterRouter = createTRPCRouter({
  subscribe: publicProcedure
    .input(
      z.object({
        email: z.string().email("Please enter a valid email address"),
        firstName: z.string().min(1, "First name is required"),
        lastName: z.string().min(1, "Last name is required"),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const { email, firstName, lastName } = input;

        // Mailchimp API integration
        const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
        const MAILCHIMP_AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID;
        const MAILCHIMP_SERVER_PREFIX = process.env.MAILCHIMP_SERVER_PREFIX;

        if (
          !MAILCHIMP_API_KEY ||
          !MAILCHIMP_AUDIENCE_ID ||
          !MAILCHIMP_SERVER_PREFIX
        ) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Newsletter service configuration error",
          });
        }

        const url = `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members`;

        const memberData = {
          email_address: email,
          status: "subscribed",
          merge_fields: {
            FNAME: firstName,
            LNAME: lastName,
          },
        };

        const response = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${MAILCHIMP_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(memberData),
        });

        if (!response.ok) {
          const errorData = (await response.json()) as { title?: string };

          // Handle specific Mailchimp errors
          if (errorData.title === "Member Exists") {
            throw new TRPCError({
              code: "CONFLICT",
              message: "You're already subscribed to our newsletter!",
            });
          }

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to subscribe to newsletter. Please try again.",
          });
        }

        return {
          success: true,
          message: "Successfully subscribed to newsletter!",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred. Please try again.",
        });
      }
    }),
});
