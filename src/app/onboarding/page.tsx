import { Metadata } from "next";
import { Suspense } from "react";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = {
  title: "Onboarding | Profile Setup",
  description: "Set up your profile to get started with Complere",
};

export default function Onboarding() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OnboardingForm />
    </Suspense>
  );
}
