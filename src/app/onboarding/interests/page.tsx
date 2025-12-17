import { Metadata } from "next";
import { InterestsForm } from "./interests-form";

export const metadata: Metadata = {
  title: "Onboarding | Interests Selection",
  description: "Select your interests to personalize your Complēre dashboard",
};

export default async function InterestsOnboarding() {
  return <InterestsForm />;
}
