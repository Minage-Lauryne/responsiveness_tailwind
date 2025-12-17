import { db } from "@/server/db";

export async function checkUser(
  userId?: string | null,
  organizationId?: string | null,
) {
  if (!userId || !organizationId) {
    throw new Error("User ID and organization ID are required");
  }

  const currentUser = await db.user.findUniqueOrThrow({
    where: {
      id: userId,
    },
    include: {
      members: {
        where: {
          organizationId,
        },
      },
    },
  });

  const membership = currentUser.members.find((m) => m.organizationId === organizationId);
  if (!membership && !currentUser.isAdmin) {
    throw new Error("Given organization ID not configured for user");
  }
}
