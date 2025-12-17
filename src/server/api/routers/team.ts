import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { TRPCError } from "@trpc/server";
import { isBefore } from "date-fns";
import { z } from "zod";




// Helper function to check if user has permission to manage team
async function checkTeamManagementPermission(
 userId: string,
 organizationId: string,
) {
 const member = await db.member.findFirst({
   where: {
     userId,
     organizationId,
   },
   select: {
     role: true,
   },
 });




 if (!member) {
   throw new TRPCError({
     code: "FORBIDDEN",
     message: "You are not a member of this organization",
   });
 }




 // Only admins can manage team
 if (member.role !== "ADMIN") {
   throw new TRPCError({
     code: "FORBIDDEN",
     message: "Only organization admins can manage team members",
   });
 }




 return member;
}




// Helper function to check seat availability (duplicated from auth.ts for use in tRPC)
async function checkSeatAvailability(organizationId: string): Promise<{
 hasAvailableSeats: boolean;
 currentMembers: number;
 pendingInvitations: number;
 totalSeats: number | null;
 isTrialOrFree: boolean;
}> {
 const organization = await db.organization.findFirst({
   where: { id: organizationId },
   select: {
     freeForever: true,
     trialEndsAt: true,
     subscriptions: {
       where: {
         status: { in: ["active", "canceled"] },
       },
       select: {
         seats: true,
       },
       orderBy: {
         createdAt: "desc",
       },
       take: 1,
     },
   },
 });




 if (!organization) {
   return {
     hasAvailableSeats: false,
     currentMembers: 0,
     pendingInvitations: 0,
     totalSeats: null,
     isTrialOrFree: false,
   };
 }




 const [currentMembers, pendingInvitations] = await Promise.all([
   db.member.count({ where: { organizationId } }),
   db.invitation.count({
     where: {
       organizationId,
       status: "PENDING",
     },
   }),
 ]);




 // Free forever organizations can always add members
 if (organization.freeForever) {
   return {
     hasAvailableSeats: true,
     currentMembers,
     pendingInvitations,
     totalSeats: null,
     isTrialOrFree: true,
   };
 }




 // Organizations in trial period can add members
 if (
   organization.trialEndsAt &&
   isBefore(new Date(), organization.trialEndsAt)
 ) {
   return {
     hasAvailableSeats: true,
     currentMembers,
     pendingInvitations,
     totalSeats: null,
     isTrialOrFree: true,
   };
 }




 // Check subscription seat limits
 const activeSubscription = organization.subscriptions[0];
 if (activeSubscription) {
   const totalPendingMembers = currentMembers + pendingInvitations;
   return {
     hasAvailableSeats: totalPendingMembers < activeSubscription.seats,
     currentMembers,
     pendingInvitations,
     totalSeats: activeSubscription.seats,
     isTrialOrFree: false,
   };
 }




 return {
   hasAvailableSeats: false,
   currentMembers,
   pendingInvitations,
   totalSeats: 0,
   isTrialOrFree: false,
 };
}




export const teamRouter = createTRPCRouter({


 // Send invitation to join organization
 inviteMember: protectedProcedure
   .input(
     z.object({
       email: z.string().email("Please enter a valid email address"),
       role: z.enum(["ADMIN", "MEMBER", "VIEWER"]).optional().default("MEMBER"),
       organizationId: z.string().optional(),
     }),
   )
   .mutation(async ({ ctx, input }) => {
     const organizationId =
       input.organizationId ?? ctx.session.session.activeOrganizationId;




     if (!organizationId) {
       throw new TRPCError({
         code: "BAD_REQUEST",
         message: "No organization specified",
       });
     }




     // Check permissions
     await checkTeamManagementPermission(ctx.session.user.id, organizationId);




     // Check if user is already a member
     const existingMember = await db.member.findFirst({
       where: {
         organizationId,
         user: {
           email: input.email,
         },
       },
     });




     if (existingMember) {
       throw new TRPCError({
         code: "BAD_REQUEST",
         message: "This user is already a member of the organization",
       });
     }




     // Check if there's already a pending invitation
     const existingInvitation = await db.invitation.findFirst({
       where: {
         organizationId,
         email: input.email,
         status: "PENDING",
       },
     });




     if (existingInvitation) {
       throw new TRPCError({
         code: "BAD_REQUEST",
         message: "An invitation has already been sent to this email address",
       });
     }




     // Check seat availability before creating invitation
     const seatInfo = await checkSeatAvailability(organizationId);
     if (!seatInfo.hasAvailableSeats && !seatInfo.isTrialOrFree) {
       throw new TRPCError({
         code: "BAD_REQUEST",
         message:
           "Cannot invite user: organization has reached its seat limit. Please upgrade your subscription to add more members.",
       });
     }




     // Create invitation directly in database
     try {
       const invitation = await db.invitation.create({
         data: {
           organizationId,
           email: input.email,
           role: input.role,
           status: "PENDING",
           type: "INVITATION",
           expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
           inviterId: ctx.session.user.id,
         },
       });




       // Send invitation email manually since we're not using Better Auth hooks
       try {
         const organization = await db.organization.findFirst({
           where: { id: organizationId },
           select: { name: true },
         });




         const inviter = await db.user.findFirst({
           where: { id: ctx.session.user.id },
           select: { name: true },
         });




         if (organization && inviter?.name) {
           const invitationLink = `${process.env.NEXT_PUBLIC_DEPLOYMENT_URL}/invite/${invitation.id}`;




           // Import the email template function
           const { getOrganizationInvitationParams } = await import(
             "@/services/email/templates/user/organization-invitation-template"
           );
           const { sendMail } = await import("@/services/email/resend");




           await sendMail(
             getOrganizationInvitationParams,
             input.email,
             organization.name,
             inviter.name,
             invitationLink,
           );
         }
       } catch (emailError) {
         console.error("Failed to send invitation email:", emailError);
         // Don't fail the invitation if email fails
       }




       return {
         success: true,
         invitationId: invitation.id,
       };
     } catch (error) {
       console.error("Failed to create invitation:", error);
       throw new TRPCError({
         code: "INTERNAL_SERVER_ERROR",
         message: "Failed to send invitation",
       });
     }
   }),




 // Cancel pending invitation
 cancelInvitation: protectedProcedure
   .input(
     z.object({
       invitationId: z.string(),
     }),
   )
   .mutation(async ({ ctx, input }) => {
     if (!ctx.session.session.activeOrganizationId) {
       throw new TRPCError({
         code: "BAD_REQUEST",
         message: "No active organization found",
       });
     }




     // Check permissions
     await checkTeamManagementPermission(
       ctx.session.user.id,
       ctx.session.session.activeOrganizationId,
     );




     // Verify invitation belongs to current organization
     const invitation = await db.invitation.findFirst({
       where: {
         id: input.invitationId,
         organizationId: ctx.session.session.activeOrganizationId,
       },
     });




     if (!invitation) {
       throw new TRPCError({
         code: "NOT_FOUND",
         message: "Invitation not found",
       });
     }




     try {
       await db.invitation.update({
         where: {
           id: input.invitationId,
         },
         data: {
           status: "CANCELED",
         },
       });




       return { success: true };
     } catch (error) {
       throw new TRPCError({
         code: "INTERNAL_SERVER_ERROR",
         message: "Failed to cancel invitation",
       });
     }
   }),




 // Remove member from organization
 removeMember: protectedProcedure
   .input(
     z.object({
       memberIdOrEmail: z.string(),
       organizationId: z.string().optional(),
     }),
   )
   .mutation(async ({ ctx, input }) => {
     const organizationId =
       input.organizationId ?? ctx.session.session.activeOrganizationId;




     if (!organizationId) {
       throw new TRPCError({
         code: "BAD_REQUEST",
         message: "No organization specified",
       });
     }




     // Check permissions
     await checkTeamManagementPermission(ctx.session.user.id, organizationId);




     // Prevent self-removal
     const targetMember = await db.member.findFirst({
       where: {
         organizationId,
         OR: [
           { id: input.memberIdOrEmail },
           { user: { email: input.memberIdOrEmail } },
         ],
       },
       include: {
         user: true,
       },
     });




     if (!targetMember) {
       throw new TRPCError({
         code: "NOT_FOUND",
         message: "Member not found",
       });
     }




     if (targetMember.userId === ctx.session.user.id) {
       throw new TRPCError({
         code: "BAD_REQUEST",
         message: "You cannot remove yourself from the organization",
       });
     }




     try {
       // Remove the member from the organization
       await db.member.delete({
         where: {
           id: targetMember.id,
         },
       });




       // Clean up active sessions for the removed user
       await db.session.updateMany({
         where: {
           userId: targetMember.userId,
           activeOrganizationId: organizationId,
         },
         data: {
           activeOrganizationId: null,
         },
       });




       return { success: true };
     } catch (error) {
       throw new TRPCError({
         code: "INTERNAL_SERVER_ERROR",
         message: "Failed to remove member",
       });
     }
   }),




 // Get team overview (members + invitations + seat info)
 getTeamOverview: protectedProcedure
   .input(
     z.object({
       organizationId: z.string().optional(),
     }),
   )
   .query(async ({ ctx, input }) => {
     const organizationId =
       input.organizationId ?? ctx.session.session.activeOrganizationId;


     if (!organizationId) {
       return {
         seatInfo: {
           hasAvailableSeats: true,
           currentMembers: 1,
           pendingInvitations: 0,
           totalSeats: null,
           isTrialOrFree: true,
         },
         members: [],
         invitations: [],
         totalMembers: 1,
         totalInvitations: 0,
       };
     }


     await checkTeamManagementPermission(ctx.session.user.id, organizationId);


     const [seatInfo, members, invitations] = await Promise.all([
       checkSeatAvailability(organizationId),
       db.member.findMany({
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
         orderBy: { createdAt: "asc" },
         take: 10,
       }),
       db.invitation.findMany({
         where: {
           organizationId,
           status: "PENDING",
           type: "INVITATION",
         },
         orderBy: { createdAt: "desc" },
         take: 10,
       }),
     ]);


    return {
      seatInfo,
      members: members.map((member: any) => ({
        id: member.id,
        role: member.role,
        createdAt: member.createdAt,
        organizationEmail: member.organizationEmail,
        user: {
          ...member.user,
        },
      })),
      invitations: invitations.map((invitation: any) => ({
        id: invitation.id,
        email: invitation.email,
        createdAt: invitation.createdAt,
        expiresAt: invitation.expiresAt,
        status: invitation.status,
      })),
      totalMembers: seatInfo.currentMembers,
      totalInvitations: seatInfo.pendingInvitations,
    };
   }),




cancelJoinRequest: protectedProcedure
 .input(z.object({ requestId: z.string() }))
 .mutation(async ({ ctx, input }) => {
const request = await db.invitation.findFirst({
  where: {
    id: input.requestId,
    user: { id: ctx.session.user.id },
    status: "PENDING",
    type: "JOIN_REQUEST",
  },
});
if (!request) {
  throw new TRPCError({ code: "NOT_FOUND", message: "Request not found or not cancelable" });
}
await db.invitation.update({
  where: { id: input.requestId },
  data: { status: "REJECTED" },
});
   return { success: true };
 }),




});


