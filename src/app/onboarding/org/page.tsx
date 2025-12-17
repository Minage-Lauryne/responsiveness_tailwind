import { Metadata } from "next";
import { Suspense } from "react";
import { OrgForm } from "./org-form";

export const metadata: Metadata = {
  title: "Onboarding | Organization Setup",
  description:
    "Set up your organization details to customize your Complēre experience",
};

export default function OrganizationOnboarding() {
   return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrgForm />
    </Suspense>
  );
}
