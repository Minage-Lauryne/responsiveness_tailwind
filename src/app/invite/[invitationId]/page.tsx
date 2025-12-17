import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/server/db";
import { isBefore } from "date-fns";
import { InvitationAcceptFlow } from "@/features/auth/components/invitation-accept-flow";
import { findUserByAnyEmail } from "@/lib/user-emails";

function isNextRedirect(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string" &&
    error.digest.startsWith("NEXT_REDIRECT")
  );
}

async function checkSeatAvailability(organizationId: string): Promise<{
  hasAvailableSeats: boolean;
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
    return { hasAvailableSeats: false, isTrialOrFree: false };
  }

  if (organization.freeForever) {
    return { hasAvailableSeats: true, isTrialOrFree: true };
  }

  if (
    organization.trialEndsAt &&
    isBefore(new Date(), organization.trialEndsAt)
  ) {
    return { hasAvailableSeats: true, isTrialOrFree: true };
  }

  const activeSubscription = organization.subscriptions[0];
  if (activeSubscription) {
    const [currentMembers, pendingInvitations] = await Promise.all([
      db.member.count({ where: { organizationId } }),
      db.invitation.count({
        where: {
          organizationId,
          status: "PENDING",
        },
      }),
    ]);

    const totalPendingMembers = currentMembers + pendingInvitations;
    return {
      hasAvailableSeats: totalPendingMembers < activeSubscription.seats,
      isTrialOrFree: false,
    };
  }

  return { hasAvailableSeats: false, isTrialOrFree: false };
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ invitationId: string }>;
}) {
  const { invitationId } = await params;

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      redirect(`/invite/accept?id=${invitationId}`);
    }

    try {
      const invitation = await db.invitation.findFirst({
        where: {
          id: invitationId,
          status: "PENDING",
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          organization: true,
        },
      });

      if (!invitation) {
        redirect(
          `/app?invite_error=${encodeURIComponent("Invalid or expired invitation")}`,
        );
        return;
      }

      const invitationEmailUser = await findUserByAnyEmail(invitation.email);
      if (invitationEmailUser && invitationEmailUser.id !== session.user.id) {
        redirect(
          `/app?invite_error=${encodeURIComponent(
            "This invitation email is linked to a different account. Please sign in with that account.",
          )}`,
        );
        return;
      }

      const userEmailsMatch = session.user.email === invitation.email;
      const emailAlreadyLinked = invitationEmailUser?.id === session.user.id;

      if (!userEmailsMatch && !emailAlreadyLinked) {
        return (
          <InvitationAcceptFlow
            invitationId={invitationId}
            invitationEmail={invitation.email}
            organizationName={invitation.organization.name}
            currentUserEmail={session.user.email ?? ""}
          />
        );
      }


      const existingMember = await db.member.findFirst({
        where: {
          userId: session.user.id,
          organizationId: invitation.organizationId,
        },
      });

      if (existingMember) {
        await db.invitation.update({
          where: { id: invitationId },
          data: { status: "ACCEPTED" },
        });
        redirect("/app?invited=true");
        return;
      }

      const seatInfo = await checkSeatAvailability(invitation.organizationId);
      if (!seatInfo.hasAvailableSeats && !seatInfo.isTrialOrFree) {
        redirect(
          `/app?invite_error=${encodeURIComponent("Organization has reached its seat limit")}`,
        );
        return;
      }

      await db.$transaction([
        db.member.create({
          data: {
            userId: session.user.id,
            organizationId: invitation.organizationId,
            organizationEmail: invitation.email,
            role: invitation.role ?? "MEMBER",
          },
        }),
        db.invitation.update({
          where: { id: invitationId },
          data: { status: "ACCEPTED" },
        }),
        db.session.updateMany({
          where: { userId: session.user.id },
          data: { activeOrganizationId: invitation.organizationId },
        }),
      ]);

      redirect("/app?invited=true");
    } catch (error) {
      if (isNextRedirect(error)) {
        throw error;
      }
      console.error("Failed to accept invitation:", error);
      redirect(
        `/app?invite_error=${encodeURIComponent("Invalid or expired invitation")}`,
      );
    }
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    console.error("Error processing invitation:", error);
    redirect("/app?invite_error=unknown");
  }
}
