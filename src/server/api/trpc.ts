// Extend the env type to include the missing property
declare module "@/create-env" {
  interface Env {
    Complere_API_KEY: string;
  }
}

import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { checkTrialChatLimit } from "@/lib/utils/chat-limit";
import { isBefore } from "date-fns";



/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth.api.getSession({
    headers: opts.headers,
  });
  return {
    db,
    session,
    ...opts,
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure;

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */

const prismaUserMiddleware = t.middleware(async ({ ctx, next }) => {
  if (!ctx?.session?.user?.id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "No valid user object found on context",
    });
  }

  try {
    const dbUser = await db.user.findFirstOrThrow({
      where: { id: ctx.session.user.id },
    });

    const mergedUser = {
      ...ctx.session.user,
      ...dbUser,
      email: dbUser.email ?? ctx.session.user.email,
    };

    return next({
      ctx: {
        ...ctx,
        session: {
          ...ctx.session,
          user: mergedUser as any,
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch user from database:", error);
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "User not found in database",
    });
  }
});

type Authorization = "freeForever" | "trial" | "subscription";

export const requiresSubscriptionMiddleware = t.middleware(
  async ({ ctx, next }) => {
    let authorization: Authorization | undefined;
    const organizationId = ctx.session?.session.activeOrganizationId;
    if (!organizationId) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "No active organization found on request context.",
      });
    }
    const organization = await db.organization.findFirstOrThrow({
      where: { id: organizationId },
      select: {
        freeForever: true,
        trialEndsAt: true,
        subscriptions: {
          where: {
            status: { in: ["active", "canceled"] },
          },
        },
      },
    });

    if (organization.freeForever) {
      authorization = "freeForever";
    } else if (organization.subscriptions.length) {
      authorization = "subscription";
    } else {
      const canProceed = await checkTrialChatLimit(organizationId);

      if (
        canProceed &&
        organization.trialEndsAt &&
        isBefore(new Date(), organization.trialEndsAt)
      ) {
        authorization = "trial";
      }
    }

    if (!authorization) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "Performing this action requires a valid subscription or trial. Please subscribe to continue.",
      });
    }

    return next<typeof ctx & { authorization: Authorization }>({
      ctx: {
        ...ctx,
        authorization,
      },
    });
  },
);

const organizationMiddleware = t.middleware(async ({ ctx, next }) => {
  const organizationId = ctx.session?.session?.activeOrganizationId;
  
  if (!organizationId) {
    const userMembership = await db.member.findFirst({
      where: { userId: ctx?.session?.user.id },
      include: { organization: true },
    });
    
    if (!userMembership) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not a member of any organization. Please join or create an organization first.",
      });
    }
    
    const allMemberships = await db.member.findMany({
      where: { userId: ctx?.session?.user.id },
    });
    
    if (allMemberships.length === 1) {
      await db.session.updateMany({
        where: { userId: ctx?.session?.user.id },
        data: { activeOrganizationId: userMembership.organizationId },
      });
      
      return next({
        ctx: {
          ...ctx,
          session: {
            ...ctx.session,
            session: {
              ...ctx?.session?.session,
              activeOrganizationId: userMembership.organizationId,
            },
          },
        },
      });
    }
    
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Please select an active organization first.",
    });
  }
  
  return next({ ctx });
});

export const protectedProcedure = t.procedure.use(prismaUserMiddleware);

export const organizationProcedure = t.procedure
  .use(prismaUserMiddleware)
  .use(organizationMiddleware);

export const adminProtectedProcedure = t.procedure
  .use(prismaUserMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.session.user.isAdmin) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User in context is lacking admin role",
      });
    }
    return next({ ctx });
  });


export const orgAdminProtectedProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const organizationId = ctx.session.session.activeOrganizationId;
  if (!organizationId) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "No active organization selected" });
  }

  const member = await db.member.findFirst({
    where: {
      userId: ctx.session.user.id,
      organizationId,
      role: "ADMIN",
    },
  });

  if (!member) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You must be an organization admin" });
  }

  return next({ ctx });
});


export const orgOrAdminProtectedProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.session.user.isAdmin) {
    return next({ ctx });
  }

  const organizationId = ctx.session.session.activeOrganizationId;
  if (!organizationId) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "No active organization selected" });
  }

  const member = await db.member.findFirst({
    where: {
      userId: ctx.session.user.id,
      organizationId,
      role: "ADMIN",
    },
  });

  if (!member) {
    throw new TRPCError({ 
      code: "FORBIDDEN", 
      message: "You must be either a platform admin or an organization admin" 
    });
  }

  return next({ ctx });
});
