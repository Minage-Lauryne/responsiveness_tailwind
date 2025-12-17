import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/server/db";

export async function PATCH(request: Request) {
  try {
    const { activeOrganizationId } = await request.json();

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (activeOrganizationId !== null) {
      const membership = await db.member.findFirst({
        where: {
          userId: session.user.id,
          organizationId: activeOrganizationId,
        },
      });

      if (!membership) {
        return NextResponse.json(
          { error: "Not a member of this organization" },
          { status: 403 }
        );
      }
    }

    await db.session.update({
      where: { id: session.session.id },
      data: { activeOrganizationId },
    });

    return NextResponse.json({ 
      success: true,
      message: activeOrganizationId 
        ? "Organization switched successfully" 
        : "Switched to personal workspace"
    });
  } catch (error) {
    console.error("Failed to update session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}