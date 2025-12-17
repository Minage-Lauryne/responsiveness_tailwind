import { z } from "zod";

import { db } from "@/server/db";
import {
  checkout,
  createAdhocBillingPortalConfiguration,
  ensureCustomer,
  openBillingPortal,
} from "@/lib/stripe";
import { protectedProcedure, createTRPCRouter } from "../trpc";
import { $Enums, Subscription, SubscriptionStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";

const currentYear = new Date().getFullYear();

async function determineAvailableSubscriptionPlan(discountCode?: string): Promise<{
  plan: "Standard" | "First100" | "FirstYear";
  isPromotional: boolean;
  originalPrice?: number;
  promotionalPrice?: number;
  description?: string;
}> {

  
  const totalActiveSubscriptions = await db.subscription.count({
    where: {
      status: { in: ["active", "canceled"] },
    },
  });

  if (totalActiveSubscriptions <= 100) {
    return {
      plan: "First100",
      isPromotional: true,
      originalPrice: 999,
      promotionalPrice: 100,
      description: "FIRST 100 - Claim your founding membership.",
    };
  }

  
  if (discountCode === "FIRSTYEAR" && (currentYear >= 2026 || totalActiveSubscriptions > 100) ) {
    return {
      plan: "FirstYear",
      isPromotional: true,
      originalPrice: 999,
      promotionalPrice: 499,
      description: "FIRST YEAR - Special pricing for your first year, then $999/year",
    };
  }

  return {
    plan: "Standard" as $Enums.SubscriptionPlan,
    isPromotional: false,
    originalPrice: 999,
    promotionalPrice: 999,
    description: "Standard pricing with full access to Complere AI",
  };
}

export const billingRouter = createTRPCRouter({
  getAvailablePricing: protectedProcedure
    .input(
      z.object({
        discountCode: z.string().optional(),
      }).optional(),
    )
    .query(async ({ input }) => {
      return await determineAvailableSubscriptionPlan(input?.discountCode);
    }),


  getFirstYearAvailability: protectedProcedure.query(async () => {
    const totalActiveSubscriptions = await db.subscription.count({
      where: {
        status: { in: ["active", "canceled"] },
      },
    });
    
    const isAvailable = currentYear >= 2026 || totalActiveSubscriptions > 100;
    
    return {
      isAvailable,
      currentYear,
      totalSubscriptions: totalActiveSubscriptions
    }
  }),

  getUserSubscriptionAccess: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session.user).id as string;

    // Check for individual subscription
    const individualSubscription = await db.subscription.findFirst({
      where: {
        userId: userId,
        type: "Individual",
        status: { in: ["active", "canceled"] },
      } as any,
    });

    // Check for team seat allocation
    const seatAllocation = await (db as any).seatAllocation.findFirst({
      where: {
        userId: userId,
        revokedAt: null, // Not revoked
        subscription: {
          status: { in: ["active", "canceled"] },
          type: "Team",
        },
      },
      include: {
        subscription: true,
      },
    });

    return {
      hasAccess: !!(individualSubscription || seatAllocation),
      subscription: individualSubscription || seatAllocation?.subscription || null,
      subscriptionType: individualSubscription ? "individual" : seatAllocation ? "team" : null,
    };
  }),
  listSubscriptions: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session.user).id as string;
    const organizationId = (ctx.session.session as any)?.activeOrganizationId as string;

    // Get user's individual subscriptions
    const individualSubscriptions = await db.subscription.findMany({
      where: {
        userId: userId,
      } as any,
    });

    // Get team subscription if user is in an organization
    let teamSubscriptions: any[] = [];
    let organizationData = null;
    
    if (organizationId) {
      const teamSubs = await db.subscription.findMany({
        where: {
          organizationId: organizationId,
          type: "Team",
        } as any,
        include: {
          seatAllocations: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            where: {
              revokedAt: null, // Only active seat allocations
            },
          },
        },
      });
      teamSubscriptions = teamSubs;

      // Get organization data for trial/freeForever info
      organizationData = await db.organization.findFirst({
        where: { id: organizationId },
        select: {
          freeForever: true,
          trialEndsAt: true,
          members: {
            select: { 
              id: true,
              userId: true,
            },
          },
        },
      });
    }

    // Combine individual and team subscriptions
    const allSubscriptions = [...individualSubscriptions, ...teamSubscriptions];

    const subscriptionsByStatus = allSubscriptions.reduce(
      (result, subscription) => {
        result[subscription.status].push(subscription);
        return result;
      },
      { active: [], canceled: [], retired: [] } as Record<
        SubscriptionStatus,
        any[]
      >,
    );

    // Calculate seat usage - but only for team subscriptions
    let seatUsage = {
      currentMembers: 1,
      pendingInvitations: 0,
      totalUsed: 1,
    };

    // Check if there's actually a team subscription for this organization
    const hasTeamSubscription = teamSubscriptions.length > 0;

    if (organizationId && organizationData && hasTeamSubscription) {
      const pendingInvitations = await db.invitation.count({
        where: {
          organizationId: organizationId,
          status: "PENDING",
        },
      });

      // Get members who have individual subscriptions (don't need team seats)
      const membersWithIndividualSubs = await db.subscription.findMany({
        where: {
          type: "Individual",
          status: { in: ["active", "canceled"] },
          user: {
            members: {
              some: {
                organizationId: organizationId,
              },
            },
          },
        } as any,
        select: { userId: true },
      });

      const membersWithIndividualSubIds = new Set(
        membersWithIndividualSubs.map(sub => sub.userId)
      );

      // Calculate members who actually need team seats
      const membersNeedingTeamSeats = organizationData.members.filter(
        member => !membersWithIndividualSubIds.has((member as any).userId)
      );

      seatUsage = {
        currentMembers: organizationData.members.length,
        pendingInvitations: pendingInvitations,
        totalUsed: membersNeedingTeamSeats.length + pendingInvitations,
      };
    } else if (organizationId && organizationData && !hasTeamSubscription) {
      // For organizations without team subscriptions, don't show misleading seat counts
      seatUsage = {
        currentMembers: organizationData.members.length,
        pendingInvitations: 0,
        totalUsed: 0, // No team seats being used since there's no team subscription
      };
    }

    return {
      subscriptionsByStatus,
      freeForever: organizationData?.freeForever || false,
      trialEndsAt: organizationData?.trialEndsAt || null,
      seatUsage,
    };
  }),
  subscribe: protectedProcedure
    .input(
      z.object({
        plan: z.nativeEnum($Enums.SubscriptionPlan).default("Standard"),
        type: z.enum(["Individual", "Team"]).default("Individual"),
        seats: z.number().min(1).max(100).optional(), // For team subscriptions
        redirects: z.object({
          success: z.string().url(),
          cancel: z.string().url(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userEmail = (ctx.session.user)?.email as string;
      const userId = (ctx.session.user)?.id as string;
      
      if (!userEmail) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Subscribing requires an email address to be set.",
        });
      }

      const { type, seats = 1 } = input;
      const organizationId = (ctx.session.session as any)?.activeOrganizationId as string;

      // Validate subscription type and context
      if (type === "Team") {
        if (!organizationId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Team subscriptions require an organization context.",
          });
        }
        
        // Check if user is admin of the organization
        const member = await db.member.findFirst({
          where: {
            userId: userId,
            organizationId: organizationId,
          },
        });

        if (!member || member.role !== "ADMIN") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only organization admins can purchase team subscriptions.",
          });
        }

        // Check if organization already has a team subscription
        const existingTeamSubscription = await db.subscription.findFirst({
          where: {
            organizationId: organizationId,
            type: "Team",
            status: { in: ["active", "canceled"] },
          } as any,
        });

        if (existingTeamSubscription) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Organization already has an active team subscription.",
          });
        }
      } else {
        // Individual subscription
        const existingIndividualSubscription = await db.subscription.findFirst({
          where: {
            userId: userId,
            type: "Individual",
            status: { in: ["active", "canceled"] },
          } as any,
        });

        if (existingIndividualSubscription) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You already have an active individual subscription.",
          });
        }
      }

      const customer = await ensureCustomer(userEmail);

      const session = await checkout(
        customer,
        type === "Team" ? organizationId : userId,
        input.plan,
        seats,
        input.redirects,
        type, // Pass subscription type
      );
      if (!session.url) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Checkout session creation did not yield a URL to redirect to.",
        });
      }
      return session.url;
    }),
  manageSubscription: protectedProcedure
    .input(
      z.object({
        redirects: z.object({
          success: z.string().url(),
          cancel: z.string().url(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session.user).id as string;
      const organizationId = (ctx.session.session as any)?.activeOrganizationId as string;

      // Try to find individual subscription first
      let subscription = await db.subscription.findFirst({
        where: {
          userId: userId,
          status: { in: ["active", "canceled"] },
        } as any,
        select: {
          stripeCustomerId: true,
          stripeSubscriptionId: true,
          seats: true,
        },
      });

      // If no individual subscription found, try team subscription
      if (!subscription && organizationId) {
        subscription = await db.subscription.findFirst({
          where: {
            organizationId: organizationId,
            type: "Team",
            status: { in: ["active", "canceled"] },
          } as any,
          select: {
            stripeCustomerId: true,
            stripeSubscriptionId: true,
            seats: true,
          },
        });
      }

      if (!subscription) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No active subscription found. You need an active subscription to manage billing.",
        });
      }
      const configurationId = await createAdhocBillingPortalConfiguration(
        subscription.stripeSubscriptionId,
        subscription.seats,
      );
      const url = await openBillingPortal(
        subscription.stripeCustomerId,
        subscription.stripeSubscriptionId,
        configurationId,
        input.redirects,
      );
      // await disableBillingPortalConfiguration(configurationId);
      return url;
    }),

  // Get organization members for seat allocation management
  getOrganizationMembers: protectedProcedure.query(async ({ ctx }) => {
    const organizationId = (ctx.session.session as any)?.activeOrganizationId as string;
    
    if (!organizationId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No organization context found.",
      });
    }

    const members = await db.member.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: [
        { role: "asc" }, // ADMIN first
        { createdAt: "asc" },
      ],
    });

    return members;
  }),

  // Allocate a seat to a user
  allocateSeat: protectedProcedure
    .input(z.object({
      userId: z.string(),
      subscriptionId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const organizationId = (ctx.session.session as any)?.activeOrganizationId as string;
      const currentUserId = (ctx.session.user).id as string;
      
      if (!organizationId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No organization context found.",
        });
      }

      // Check if current user is admin
      const currentUserMember = await db.member.findFirst({
        where: {
          userId: currentUserId,
          organizationId,
          role: "ADMIN",
        },
      });

      if (!currentUserMember) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only organization admins can manage seat allocations.",
        });
      }

      // Verify subscription belongs to organization
      const subscription = await db.subscription.findFirst({
        where: {
          id: input.subscriptionId,
          organizationId,
          type: "Team",
          status: { in: ["active", "canceled"] },
        },
      });

      if (!subscription) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team subscription not found.",
        });
      }

      // Check if user is member of organization
      const targetMember = await db.member.findFirst({
        where: {
          userId: input.userId,
          organizationId,
        },
      });

      if (!targetMember) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User is not a member of this organization.",
        });
      }

      // Check if there's any existing allocation (active or revoked)
      const existingAllocation = await (db as any).seatAllocation.findUnique({
        where: {
          subscriptionId_userId: {
            subscriptionId: input.subscriptionId,
            userId: input.userId,
          },
        },
      });

      // If there's an active allocation, throw error
      if (existingAllocation && !existingAllocation.revokedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Seat is already allocated to this user.",
        });
      }

      // Check if there are available seats (only count non-revoked allocations)
      const currentAllocations = await (db as any).seatAllocation.count({
        where: {
          subscriptionId: input.subscriptionId,
          revokedAt: null,
        },
      });

      if (currentAllocations >= subscription.seats) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No available seats. Upgrade subscription to add more seats.",
        });
      }

      // Use upsert to handle the case where there's a revoked allocation
      const allocation = await (db as any).seatAllocation.upsert({
        where: {
          subscriptionId_userId: {
            subscriptionId: input.subscriptionId,
            userId: input.userId,
          },
        },
        create: {
          subscriptionId: input.subscriptionId,
          userId: input.userId,
          allocatedAt: new Date(),
        },
        update: {
          revokedAt: null, // Un-revoke if it was previously revoked
          allocatedAt: new Date(), // Update allocation time
        },
      });

      return allocation;
    }),

  // Revoke a seat from a user
  revokeSeat: protectedProcedure
    .input(z.object({
      userId: z.string(),
      subscriptionId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const organizationId = (ctx.session.session as any)?.activeOrganizationId as string;
      const currentUserId = (ctx.session.user).id as string;
      
      if (!organizationId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No organization context found.",
        });
      }

      // Check if current user is admin
      const currentUserMember = await db.member.findFirst({
        where: {
          userId: currentUserId,
          organizationId,
          role: "ADMIN",
        },
      });

      if (!currentUserMember) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only organization admins can manage seat allocations.",
        });
      }

      // Find and revoke the seat allocation
      const allocation = await (db as any).seatAllocation.findFirst({
        where: {
          subscriptionId: input.subscriptionId,
          userId: input.userId,
          revokedAt: null,
        },
      });

      if (!allocation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Active seat allocation not found for this user.",
        });
      }

      // Revoke the seat
      const revokedAllocation = await (db as any).seatAllocation.update({
        where: { id: allocation.id },
        data: { revokedAt: new Date() },
      });

      return revokedAllocation;
    }),
});
