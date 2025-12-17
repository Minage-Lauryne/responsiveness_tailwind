import { NextResponse } from "next/server";
import db from "@/server/db";
import { sendMail } from "@/services/email/resend";
import { isAfter, differenceInCalendarDays } from "date-fns";
import { getInvitationReminderParams } from "@/services/email/templates/user/invitation-reminder-template";
import { getInvitationExpiredParams } from "@/services/email/templates/user/invitation-expired-template";

export async function GET() {
  const now = new Date();
  const pendingInvites = await db.invitation.findMany({
    where: { status: "PENDING" },
    include: {
      organization: {
        select: {
          name: true,
        },
      },
    },
  });
  const reminderJobs: Promise<any>[] = [];
  const expiryJobs: Promise<any>[] = [];
  for (const invite of pendingInvites) {
    const daysSinceCreation = differenceInCalendarDays(now, invite.createdAt);
    if (daysSinceCreation === 3) {
      if (!invite.token) {
        console.warn(`Skipping reminder for invite ${invite.id}: missing token`);
      } else if (!invite.expiresAt) {
        console.warn(`Skipping reminder for invite ${invite.id}: missing expiresAt`);
      } else {
        reminderJobs.push(
          sendMail(
            getInvitationReminderParams,
            invite.email,
            invite.organization?.name ?? "the organization",
            invite.token,
            invite.expiresAt
          )
        );
      }
    }
  
    if (invite.expiresAt && isAfter(now, invite.expiresAt)) {
      await db.invitation.update({
        where: { id: invite.id },
        data: { status: "EXPIRED" },
      });
      expiryJobs.push(
        sendMail(
          getInvitationExpiredParams,
          invite.email,
          invite.organization?.name ?? "the organization"
        )
      );
    }
  }
  await Promise.all([...reminderJobs, ...expiryJobs]);
  return NextResponse.json({ message: "Processed invitations" });
}