import { Metadata } from "next";
import { Suspense } from "react";
import { AcceptInvitationFlow } from "./accept-invitation-flow";

export const metadata: Metadata = {
  title: "Accept Invitation | Complēre",
  description: "Accept your invitation to join Complēre",
};

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AcceptInvitationFlow />
    </Suspense>
  );
}
