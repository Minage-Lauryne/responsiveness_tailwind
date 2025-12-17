import type { Metadata } from "next";
import { headers as getHeaders } from "next/headers";

import { V2Container } from "@/features/dashboard-layout/v2-container";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { config } from "@/app/(external)/legal/config";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { db } from "@/server/db";

export const metadata: Metadata = {
  title: "Complēre Dashboard",
  description: "Complēre - Funder toolkit for modern strategy.",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await getHeaders(),
  });

  if (!session) {
    return redirect(config.loginUrl);
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { 
      deletedAt: true,
      hasCompletedOrgOnboarding: true,
      name: true,
    },
  });

  if (user?.deletedAt) {
    return redirect("/account/restore");
  }

  if (user?.name && !user?.hasCompletedOrgOnboarding) {
    const memberCount = await db.member.count({
      where: { 
        userId: session.user.id,
        deletedAt: null 
      }
    });

    if (memberCount === 0) {
      const pendingJoinRequests = await db.invitation.count({
        where: {
          inviterId: session.user.id,
          type: "JOIN_REQUEST",
          status: "PENDING",
        }
      });

      if (pendingJoinRequests === 0) {
        return redirect("/onboarding/organization");
      }
    }
  }

  if (!session.user.name) {
    return redirect("/onboarding");
  }

  if (!session.user.isBetaUser && !session.user.isAdmin) {
    const organizationId = session.session.activeOrganizationId;
    
    if (organizationId) {
      const organization = await db.organization.findFirst({
        where: { id: organizationId },
        select: {
          freeForever: true,
          subscriptions: {
            where: {
              status: { in: ["active", "canceled"] },
            },
          },
        },
      });

      // Allow access if organization has subscription or is free forever
      if (!organization?.freeForever && !organization?.subscriptions.length) {
        return redirect("/waitlist");
      }
    }
  }

  return (
    <NuqsAdapter>
      <V2Container>{children}</V2Container>
    </NuqsAdapter>
  );
}
