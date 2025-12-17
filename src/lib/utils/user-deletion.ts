/**
 * User deletion utilities and constants
 */

export const USER_DELETION_CONSTANTS = {
  DELETED_USER_NAME: "Deleted User",
  GRACE_PERIOD_DAYS: 30,
  APPEAL_WINDOW_HOURS: 48,
  getDeletedEmail: (userId: string) => `deleted_${userId}@deleted.com`,
} as const;

export const activeUserFilter = { deletedAt: null } as const;

export function isOnlyMember(totalMembers: number): boolean {
  return totalMembers === 1;
}

export function isMultiMemberOrganization(totalMembers: number): boolean {
  return totalMembers > 1;
}

export function getGracePeriodEndDate(deletedAt: Date): Date {
  const endDate = new Date(deletedAt);
  endDate.setDate(endDate.getDate() + USER_DELETION_CONSTANTS.GRACE_PERIOD_DAYS);
  return endDate;
}

export function isGracePeriodExpired(deletedAt: Date): boolean {
  const now = new Date();
  const gracePeriodEnd = getGracePeriodEndDate(deletedAt);
  return now > gracePeriodEnd;
}

export function getCreatorDisplayName(
  creator: { name?: string | null; firstName?: string | null; deletedAt?: Date | null } | null
): string {
  if (!creator) return "Unknown";
  if (creator.deletedAt) return USER_DELETION_CONSTANTS.DELETED_USER_NAME;
  return creator.name || creator.firstName || "Unknown";
}

export function getAppealWindowEndDate(rejectedAt: Date): Date {
  const endDate = new Date(rejectedAt);
  endDate.setHours(endDate.getHours() + USER_DELETION_CONSTANTS.APPEAL_WINDOW_HOURS);
  return endDate;
}

export function isAppealWindowExpired(rejectedAt: Date): boolean {
  const now = new Date();
  const appealWindowEnd = getAppealWindowEndDate(rejectedAt);
  return now > appealWindowEnd;
}

export function canAppeal(status: string, rejectedAt: Date | null, appealedAt: Date | null): boolean {
  if (status !== "REJECTED") return false;
  if (!rejectedAt) return false;
  if (appealedAt) return false;
  return !isAppealWindowExpired(rejectedAt);
}