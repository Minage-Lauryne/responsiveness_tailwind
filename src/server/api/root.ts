import { createTRPCRouter } from "@/server/api/trpc";
import { adminRouter } from "./routers/admin";
import { authRouter } from "./routers/auth";
import { chatRouter } from "./routers/chat";
import { eventsRouter } from "./routers/events";
import { filesRouter } from "./routers/files";
import { meRouter } from "./routers/me";
import { newsletterRouter } from "./routers/newsletter";
import { organizationRouter } from "./routers/organization";
import { researchDocumentsRouter } from "./routers/research-documents";
import { subjectRouter } from "./routers/subject";
import { testRouter } from "./routers/test";
import { userRouter } from "./routers/user";
import { billingRouter } from "./routers/billing";
import { teamRouter } from "./routers/team";
import { emailRouter } from "./routers/email";
import { userEmailsRouter } from "./routers/user-emails";
import { invitationRouter } from "./routers/invitation";
import { irsRouter } from "./routers/irs";
import { form990Router } from "./routers/form990";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  auth: authRouter,
  me: meRouter,
  organization: organizationRouter,
  user: userRouter,
  researchDocuments: researchDocumentsRouter,
  files: filesRouter,
  chat: chatRouter,
  events: eventsRouter,
  newsletter: newsletterRouter,
  subject: subjectRouter,
  admin: adminRouter,
  test: testRouter,
  billing: billingRouter,
  team: teamRouter,
  email: emailRouter,
  userEmails: userEmailsRouter,
  invitation: invitationRouter,
  irs: irsRouter,
  form990: form990Router,
});

// export type definition of API
export type AppRouter = typeof appRouter;