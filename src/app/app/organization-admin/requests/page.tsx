"use client";

import { JoinRequestsManager } from "@/components/organization/join-requests-manager";

export default function RequestsPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Join Requests</h1>
      <p className="text-muted-foreground">Review and respond to pending membership requests.</p>
      <JoinRequestsManager />
    </div>
  );
}
