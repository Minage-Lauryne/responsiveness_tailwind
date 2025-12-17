"use client";

import { MembersManager } from "@/components/organization/members-manager";

export default function InvitationsPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Organization Invitations</h1>
      <p className="text-muted-foreground">Manage roles, invite users, and resend invitations.</p>
      <MembersManager />
    </div>
  );
}
