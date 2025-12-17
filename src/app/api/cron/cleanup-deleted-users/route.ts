import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { isGracePeriodExpired } from "@/lib/utils/user-deletion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function permanentlyDeleteUser(userId: string): Promise<void> {
  await db.$transaction([
    db.chat.deleteMany({ where: { userId } }),
    db.subject.deleteMany({ where: { createdById: userId } }),
    db.researchRequest.deleteMany({ where: { createdById: userId } }),
    db.workspaceDocument.deleteMany({ where: { addedById: userId } }),
    db.seatAllocation.deleteMany({ where: { userId } }),
    db.subscription.deleteMany({ where: { userId } }),
    db.member.deleteMany({ where: { userId } }),
    db.invitation.deleteMany({ where: { inviterId: userId } }),
    db.session.deleteMany({ where: { userId } }),
    db.account.deleteMany({ where: { userId } }),
    db.userEmail.deleteMany({ where: { userId } }),
    db.user.delete({ where: { id: userId } }),
  ]);
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const usersToDelete = await db.user.findMany({
      where: {
        deletedAt: { not: null },
      },
      select: {
        id: true,
        email: true,
        deletedAt: true,
      },
    });

    const expiredUsers = usersToDelete.filter(
      (user) => user.deletedAt && isGracePeriodExpired(user.deletedAt)
    );

    if (expiredUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No users to permanently delete",
        deletedCount: 0,
      });
    }

    let deletedCount = 0;

    for (const user of expiredUsers) {
      try {
        await permanentlyDeleteUser(user.id);
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete user ${user.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Permanently deleted ${deletedCount} users`,
      deletedCount,
      userIds: expiredUsers.map(u => ({ 
        id: u.id, 
        email: u.email, 
        deletedAt: u.deletedAt,
      })),
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}