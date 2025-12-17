import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    NODE_ENV: z.enum(["development", "production"]),
    POSTGRES_PRISMA_URL: z
      .string()
      .url()
      .refine(
        (str) => !str.includes("YOUR_SQL_URL_HERE"),
        "You forgot to change the default URL",
      ),
    POSTGRES_URL_NON_POOLING: z
      .string()
      .url()
      .refine(
        (str) => !str.includes("YOUR_SQL_URL_HERE"),
        "You forgot to change the default URL",
      ),
    BILLIAM_AUTH_SECRET: z.string().min(1),
    DEV_ADMIN_EMAIL: z.string().email(),
    RESEND_API_KEY: z.string().min(1),
    OPENAI_API_KEY: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string(),
    CRON_SECRET: z.string().min(1),
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1),
    POSTHOG_API_KEY: z.string().min(1),
    POSTHOG_ENV_ID: z.string().min(1),
    STRIPE_WEBHOOK_SIGNING_SECRET: z.string().min(1),
    STRIPE_SECRET_KEY: z.string().min(1),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_DEPLOYMENT_URL: z.string(),
    NEXT_PUBLIC_SUPABASE_URL: z.string(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
    NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().min(1),
    NEXT_PUBLIC_PROPUBLICA_API_URL: z.string().url().default("https://projects.propublica.org/nonprofits/api/v2"),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL,
    POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING,
    NEXT_PUBLIC_DEPLOYMENT_URL: process.env.NEXT_PUBLIC_DEPLOYMENT_URL,
    BILLIAM_AUTH_SECRET: process.env.BILLIAM_AUTH_SECRET,
    DEV_ADMIN_EMAIL: process.env.DEV_ADMIN_EMAIL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    CRON_SECRET: process.env.CRON_SECRET,
    GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    POSTHOG_API_KEY: process.env.POSTHOG_API_KEY,
    POSTHOG_ENV_ID: process.env.POSTHOG_ENV_ID,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SIGNING_SECRET: process.env.STRIPE_WEBHOOK_SIGNING_SECRET,
    NEXT_PUBLIC_PROPUBLICA_API_URL: process.env.NEXT_PUBLIC_PROPUBLICA_API_URL,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});