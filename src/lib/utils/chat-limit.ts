import { db } from "@/server/db";
import { isBefore } from "date-fns";

/**
 * Check if an organization has exceeded the trial chat limit
 * @param organizationId - The organization ID to verify trial status and chat count
 * @returns Promise<boolean> - true if organization is within limit, false if exceeded
 */
export async function checkTrialChatLimit(
  organizationId: string,
): Promise<boolean> {
  const organization = await db.organization.findFirstOrThrow({
    where: { id: organizationId },
    select: {
      freeForever: true,
      trialEndsAt: true,
      trialChatCount: true,
      members: {
        select: {
          userId: true,
        },
      },
      subscriptions: {
        where: {
          status: { in: ["active", "canceled"] } as const,
        },
        select: {
          id: true,
        },
      },
    },
  });

  // If they have subscription or are free forever, they can proceed
  if (organization.freeForever || organization.subscriptions.length > 0) {
    return true;
  }

  // If no trial or trial expired, they cannot proceed
  if (
    !organization.trialEndsAt ||
    !isBefore(new Date(), organization.trialEndsAt)
  ) {
    return false;
  }

  // They're in an active trial - check chat count across the organization
  const userIds = organization.members.map((member) => member.userId);
  const chatCount = await db.chat.count({
    where: {
      userId: {
        in: userIds,
      },
    },
  });

  return chatCount < organization.trialChatCount;
}

/**
 * Get current chat count for an organization
 * @param organizationId - The organization ID to get chat count for
 * @returns Promise<number> - current chat count across all organization members
 */
export async function getOrganizationChatCount(
  organizationId: string,
): Promise<number> {
  const organization = await db.organization.findFirstOrThrow({
    where: { id: organizationId },
    select: {
      members: {
        select: {
          userId: true,
        },
      },
    },
  });

  const userIds = organization.members.map((member) => member.userId);

  return await db.chat.count({
    where: {
      userId: {
        in: userIds,
      },
    },
  });
}
