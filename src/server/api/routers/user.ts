import {
  adminProtectedProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import { db } from "@/server/db";
import { sendMail } from "@/services/email/resend";
import { getBetaUserTemplateParams } from "@/services/email/templates/user/beta-user-template";
import { TRPCError } from "@trpc/server";
import { getWorkspaceContext } from "@/lib/workspace";
import { z } from "zod";
import {
  USER_DELETION_CONSTANTS,
  activeUserFilter,
  isOnlyMember,
  isMultiMemberOrganization,
  isGracePeriodExpired,
  isAppealWindowExpired,
} from "@/lib/utils/user-deletion";
import { getAccountDeletedTemplateParams } from "@/services/email/templates/user/account-deleted-template";
import { getRestorationRequestTemplateParams } from "@/services/email/templates/user/restoration-request-template";
import { getAccountRestoredTemplateParams } from "@/services/email/templates/user/account-restored-template";
import { getAccountRejectionTemplateParams } from "@/services/email/templates/user/account-rejection-template";
import { getAppealNotificationTemplateParams } from "@/services/email/templates/user/appeal-notification-template";

export const userRouter = createTRPCRouter({
  list: adminProtectedProcedure.query(async () => {
    const rows = await db.user.findMany({
      orderBy: {
        createdAt: "asc",
      },
      include: {
        members: {
          include: {
            organization: true,
          },
        },
        _count: {
          select: {
            chats: true,
          },
        },
        sessions: {
          select: {
            updatedAt: true,
          },
          orderBy: {
            updatedAt: "desc",
          },
          take: 1,
        },
      },
    });

    return rows.map((row) => ({
      organizationsList: row.members.map((m) => m.organization.name).join(", "),
      organizations: row.members.map((m) => ({
        id: m.organization.id,
        name: m.organization.name,
        role: m.role,
        createdAt: m.organization.createdAt,
      })),
      chatActivity: row._count.chats,
      lastActive: row.sessions[0]?.updatedAt || null,
      ...row,
    }));
  }),

  toggleBetaProgram: adminProtectedProcedure
    .input(
      z.object({
        id: z.string(),
        isBetaUser: z.boolean(),
        withWelcomeEmail: z.boolean().optional(),
      }),
    )
    .mutation(async (opts) => {
      const { id, isBetaUser, withWelcomeEmail } = opts.input;

      const user = await db.user.update({
        where: {
          id,
        },
        data: {
          isBetaUser,
        },
      });

      if (!isBetaUser) {
        return user;
      }

      if (!user.email) {
        throw new Error("User does not have an email address");
      }

      if (withWelcomeEmail) {
        await sendMail(
          getBetaUserTemplateParams,
          user.email,
          user.name ?? undefined,
        );
      }

      return user;
    }),

  addUser: adminProtectedProcedure
    .input(
      z.object({
        email: z.string(),
        name: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const exists = await db.user.findFirst({
        where: {
          email: input.email,
        },
      });

      if (exists) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User with this email already exists",
        });
      }

      const user = await db.user.create({
        data: {
          name: input.name,
          email: input.email,
          isBetaUser: true,
        },
      });

      await sendMail(
        getBetaUserTemplateParams,
        user.email!,
        user.name ?? undefined,
      );
      return user;
    }),

  updateUser: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return db.user.update({
        where: {
          id: ctx.session.user.id,
        },
        data: {
          name: input.name,
        },
      });
    }),

  get: adminProtectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const user = await db.user.findUnique({
        where: { id: input.id },
        include: {
          members: {
            include: {
              organization: true,
            },
          },
          sessions: {
            select: {
              updatedAt: true,
              createdAt: true,
              ipAddress: true,
              userAgent: true,
            },
            orderBy: {
              updatedAt: "desc",
            },
            take: 10,
          },
          Subject: {
            select: {
              id: true,
              title: true,
              context: true,
              createdAt: true,
              isArchived: true,
              documents: {
                select: {
                  id: true,
                  name: true,
                  fileType: true,
                  pageCount: true,
                  supabaseURL: true,
                },
              },
              chats: {
                select: {
                  id: true,
                  type: true,
                  createdAt: true,
                  title: true,
                },
                orderBy: {
                  createdAt: "desc",
                },
              },
              _count: {
                select: {
                  chats: true,
                },
              },
            },
            where: {
              isArchived: false,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          chats: {
            select: {
              id: true,
              type: true,
              createdAt: true,
              title: true,
              Subject: {
                select: {
                  title: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          _count: {
            select: {
              chats: true,
            },
          },
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const chatsByType = user.chats.reduce(
        (acc, chat) => {
          acc[chat.type] = (acc[chat.type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      const subjectsWithGroupedChats = user.Subject.map((subject) => {
        const chatsByType = subject.chats.reduce(
          (acc, chat) => {
            acc[chat.type] = (acc[chat.type] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        );

        return {
          ...subject,
          chatsByType,
        };
      });

      return {
        ...user,
        subjects: subjectsWithGroupedChats,
        chatsByType,
        organizationsList: user.members
          .map((m) => m.organization.name)
          .join(", "),
        organizations: user.members.map((m) => ({
          id: m.organization.id,
          name: m.organization.name,
          role: m.role,
          createdAt: m.organization.createdAt,
        })),
        chatActivity: user._count.chats,
        lastActive: user.sessions[0]?.updatedAt || null,
      };
    }),

  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.user.findUnique({
      where: { id: ctx.session.user.id },
      include: {
        members: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const primaryOrg = user.members[0]?.organization;

    return {
      email: user.email,
      organizationId: primaryOrg?.id,
      organizationName: primaryOrg?.name,
    };
  }),
  deleteAccount: protectedProcedure
  .input(
    z.object({
      promoteAdmins: z.record(z.string(), z.string()).optional(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const deletingUserId = ctx.session.user.id;

    const existingUser = await db.user.findFirst({
      where: { id: deletingUserId, ...activeUserFilter },
    });

    if (!existingUser) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found or already deleted",
      });
    }

    const userMemberships = await db.member.findMany({
      where: { userId: deletingUserId, ...activeUserFilter },
      include: {
        organization: {
          include: {
            members: { where: activeUserFilter },
          },
        },
      },
    });

    const lastAdminOrgs: string[] = [];
    const organizationsToDelete: string[] = [];
    const promoteAdmins = input.promoteAdmins ?? {};

    for (const membership of userMemberships) {
      const totalMembers = membership.organization.members.length;
      
      if (isOnlyMember(totalMembers)) {
        organizationsToDelete.push(membership.organizationId);
        continue;
      }

      if (membership.role !== "ADMIN" || !isMultiMemberOrganization(totalMembers)) continue;

      const otherAdminCount = await db.member.count({
        where: {
          organizationId: membership.organizationId,
          role: "ADMIN",
          userId: { not: deletingUserId },
          ...activeUserFilter,
        },
      });

      if (otherAdminCount === 0) {
        const newAdminId = promoteAdmins[membership.organizationId];
        
        if (!newAdminId) {
          lastAdminOrgs.push(membership.organization.name);
          continue;
        }

        const promoteCandidate = await db.member.findFirst({
          where: {
            organizationId: membership.organizationId,
            userId: newAdminId,
            ...activeUserFilter,
          },
        });

        if (!promoteCandidate) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `The selected user is not a member of "${membership.organization.name}" and cannot be promoted.`,
          });
        }

        await db.member.update({
          where: { id: promoteCandidate.id },
          data: { role: "ADMIN" },
        });
      }
    }

    if (lastAdminOrgs.length > 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `You are the only administrator in the following organization(s): ${lastAdminOrgs.join(', ')}. To proceed with account deletion, please select replacement administrators for each organization. This ensures organizational continuity and prevents data access issues.`,
      });
    }

    const deletionDate = new Date();
    
    await db.$transaction([
      db.chat.deleteMany({
        where: { 
          userId: deletingUserId,
          organizationId: null,
          ...activeUserFilter 
        },
      }),
      
      db.subject.updateMany({
        where: { 
          createdById: deletingUserId,
          organizationId: null,
          ...activeUserFilter,
        },
        data: { deletedAt: deletionDate },
      }),

      db.member.deleteMany({
        where: { userId: deletingUserId },
      }),

      ...(organizationsToDelete.length > 0 ? [
        db.organization.deleteMany({
          where: { id: { in: organizationsToDelete } },
        }),
      ] : []),

      db.session.deleteMany({
        where: { userId: deletingUserId },
      }),
      
      db.user.update({
        where: { id: deletingUserId },
        data: {
          deletedAt: deletionDate,
        },
      }),
    ]);

    if (existingUser.email) {
      await sendMail(
        getAccountDeletedTemplateParams,
        existingUser.email,
        existingUser.name ?? undefined,
      );
    }

    return {
      success: true,
      message: "Your account deletion request has been processed. You have 30 days to request restoration if needed. A confirmation email has been sent to your email address.",
    };
  }),
  getUserOrganizations: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    
    const memberships = await db.member.findMany({
      where: { 
        userId,
        ...activeUserFilter,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            members: { 
              where: activeUserFilter,
              select: {
                userId: true,
                role: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            }, 
          },
        },
      },
    });
    
    return memberships.map(membership => ({
      organizationId: membership.organization.id,
      organizationName: membership.organization.name,
      userRole: membership.role,
      totalMembers: membership.organization.members.length,
      otherMembers: membership.organization.members
        .filter(member => member.userId !== userId)
        .map(member => ({ user: member.user })),
    }));
  }),

  getLastAdminOrganizations: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    
    const adminMemberships = await db.member.findMany({
      where: { 
        userId, 
        role: "ADMIN",
        ...activeUserFilter,
      },
      include: {
        organization: {
          include: {
            members: { 
              where: activeUserFilter,
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            }, 
          },
        },
      },
    });
  
    const lastAdminOrgs = [];
  
    for (const membership of adminMemberships) {
      const totalMembers = membership.organization.members.length;
      
      if (!isMultiMemberOrganization(totalMembers)) continue;
  
      const otherAdminCount = await db.member.count({
        where: {
          organizationId: membership.organizationId,
          role: "ADMIN",
          userId: { not: userId },
          ...activeUserFilter,
        },
      });
  
      if (otherAdminCount === 0) {
        lastAdminOrgs.push({
          organizationId: membership.organizationId,
          organizationName: membership.organization.name,
          members: membership.organization.members
            .filter(member => member.userId !== userId)
            .map(member => ({ user: member.user })),
        });
      }
    }
  
    return lastAdminOrgs;
  }),

  requestRestoration: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user?.deletedAt) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Account is not deleted",
      });
    }

    if (isGracePeriodExpired(user.deletedAt)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Grace period has expired. Account cannot be restored.",
      });
    }

    const existingRequest = await db.restorationRequest.findFirst({
      where: {
        userId,
        status: "PENDING",
      },
    });

    if (existingRequest) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "A restoration request already exists for this account",
      });
    }

    const request = await db.restorationRequest.create({
      data: {
        userId,
        status: "PENDING",
      },
    });

    if (user.email) {
      await sendMail(
        getRestorationRequestTemplateParams,
        "support@complere.ai",
        undefined,
        {
          userName: user.name || user.email,
          userEmail: user.email,
          requestedAt: request.requestedAt,
        },
      );
    }

    return request;
  }),

  getMyRestorationRequest: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { deletedAt: true },
    });

    const whereClause: any = { userId };
    
    if (user?.deletedAt) {
      whereClause.requestedAt = {
        gte: user.deletedAt,
      };
    }

    return await db.restorationRequest.findFirst({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });
  }),

  listRestorationRequests: adminProtectedProcedure.query(async () => {
    const requests = await db.restorationRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            deletedAt: true,
          },
        },
      },
      orderBy: { requestedAt: "desc" },
    });

    const now = new Date();
    const expiredRequests = requests.filter(
      (req) =>
        req.status === "PENDING" &&
        req.user.deletedAt &&
        isGracePeriodExpired(req.user.deletedAt),
    );

    if (expiredRequests.length > 0) {
      await db.restorationRequest.updateMany({
        where: {
          id: { in: expiredRequests.map((req) => req.id) },
        },
        data: {
          status: "EXPIRED",
          resolvedAt: now,
        },
      });

      return requests.map((req) =>
        expiredRequests.find((exp) => exp.id === req.id)
          ? { ...req, status: "EXPIRED", resolvedAt: now }
          : req,
      );
    }

    return requests;
  }),

  approveRestoration: adminProtectedProcedure
    .input(z.object({ requestId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const adminId = ctx.session.user.id;

      const request = await db.restorationRequest.findUnique({
        where: { id: input.requestId },
        include: { user: true },
      });

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Restoration request not found",
        });
      }

      const canApprove = 
        request.status === "PENDING" || 
        (request.status === "REJECTED" && request.appealMessage);

      if (!canApprove) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot approve request with status: ${request.status}`,
        });
      }

      if (!request.user.deletedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User account is not deleted",
        });
      }

      if (isGracePeriodExpired(request.user.deletedAt)) {
        await db.restorationRequest.update({
          where: { id: input.requestId },
          data: {
            status: "EXPIRED",
            resolvedAt: new Date(),
            resolvedBy: adminId,
          },
        });

        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Grace period has expired. Account cannot be restored.",
        });
      }

      await db.$transaction([
        db.user.update({
          where: { id: request.userId },
          data: { 
            deletedAt: null,
            hasCompletedOrgOnboarding: false,
          },
        }),
        db.subject.updateMany({
          where: { 
            createdById: request.userId,
            organizationId: null,
          },
          data: { deletedAt: null },
        }),
        db.restorationRequest.update({
          where: { id: input.requestId },
          data: {
            status: "APPROVED",
            resolvedAt: new Date(),
            resolvedBy: adminId,
          },
        }),
      ]);

      if (request.user.email) {
        await sendMail(
          getAccountRestoredTemplateParams,
          request.user.email,
          request.user.name ?? undefined,
        );
      }

      return { success: true };
    }),

  rejectRestoration: adminProtectedProcedure
    .input(z.object({ 
      requestId: z.string(),
      reason: z.string().min(10, "Rejection reason must be at least 10 characters"),
    }))
    .mutation(async ({ input, ctx }) => {
      const adminId = ctx.session.user.id;

      const request = await db.restorationRequest.findUnique({
        where: { id: input.requestId },
        include: { user: true },
      });

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Restoration request not found",
        });
      }

      const isAppealRejection = request.status === "REJECTED" && request.appealMessage;

      if (request.status !== "PENDING" && !isAppealRejection) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Request is already ${request.status.toLowerCase()}`,
        });
      }

      const newStatus = isAppealRejection ? "REJECTED_FINAL" : "REJECTED";
      const rejectionReason = isAppealRejection 
        ? `Appeal Rejected: ${input.reason}\n\nOriginal Rejection: ${request.rejectionReason || "No reason provided"}`
        : input.reason;

      await db.restorationRequest.update({
        where: { id: input.requestId },
        data: {
          status: newStatus,
          resolvedAt: new Date(),
          resolvedBy: adminId,
          rejectionReason: rejectionReason,
        },
      });

      if (request.user.email) {
        if (isAppealRejection) {
          await sendMail(
            getAccountRejectionTemplateParams,
            request.user.email,
            request.user.name ?? undefined,
            {
              rejectionReason: input.reason,
              rejectedAt: new Date(),
              isAppealRejection: true,
            },
          );
        } else {
          await sendMail(
            getAccountRejectionTemplateParams,
            request.user.email,
            request.user.name ?? undefined,
            {
              rejectionReason: input.reason,
              rejectedAt: new Date(),
            },
          );
        }
      }

      return { success: true };
    }),

  appealRejection: protectedProcedure
    .input(z.object({ 
      requestId: z.string(),
      message: z.string().min(20, "Appeal message must be at least 20 characters"),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      const request = await db.restorationRequest.findUnique({
        where: { id: input.requestId },
        include: { user: true },
      });

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Restoration request not found",
        });
      }

      if (request.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only appeal your own restoration requests",
        });
      }

      if (request.status === "REJECTED_FINAL") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This restoration request has been permanently rejected and cannot be appealed.",
        });
      }

      if (request.status !== "REJECTED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only appeal rejected requests",
        });
      }

      if (request.appealedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You have already submitted an appeal for this request",
        });
      }

      if (!request.resolvedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Request has not been rejected yet",
        });
      }

      if (isAppealWindowExpired(request.resolvedAt)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Appeal window has expired. You had 48 hours to submit an appeal after rejection.",
        });
      }

      if (!request.user.deletedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User account is not deleted",
        });
      }

      if (isGracePeriodExpired(request.user.deletedAt)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Grace period has expired. Account cannot be restored.",
        });
      }

      await db.restorationRequest.update({
        where: { id: input.requestId },
        data: {
          appealMessage: input.message,
          appealedAt: new Date(),
        },
      });

      await sendMail(
        getAppealNotificationTemplateParams,
        "support@complere.ai",
        undefined,
        {
          userName: request.user.name || request.user.email || "Unknown User",
          userEmail: request.user.email || "No email",
          appealMessage: input.message,
          rejectionReason: request.rejectionReason || "No reason provided",
          appealedAt: new Date(),
        },
      );

      return { success: true };
    }),

  completeOrgOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
    await db.user.update({
      where: { id: ctx.session.user.id },
      data: { hasCompletedOrgOnboarding: true },
    });

    return { success: true };
  }),
});