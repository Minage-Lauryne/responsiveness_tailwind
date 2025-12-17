import { env } from "@/create-env";

const PROD_EMAILS = ["ryan@petersenconsultants.com"];

export const ADMINS_EMAILS =
  process.env.NODE_ENV === "production" ? PROD_EMAILS : [env.DEV_ADMIN_EMAIL];

export const ADMINS_EMAILS_STRING = ADMINS_EMAILS.join(", ");

export const SUPPORT_EMAIL =
  env.NODE_ENV === "production" ? "support@complere.ai" : env.DEV_ADMIN_EMAIL;

export const SEND_FROM_EMAIL = "noreply@updates.complere.ai";

export const FRONTEND_URL =
  process.env.NEXT_PUBLIC_DEPLOYMENT_URL ??
  "http://localhost:4040";

export const FALLBACK_ORG =
  process.env.NEXT_PUBLIC_FALLBACK_ORG ?? "Complere";