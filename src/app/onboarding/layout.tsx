import type { Metadata } from "next";
import { GradientMediumContainer } from "@/components/complere/gradient-medium";
import { Logo } from "@/components/complere/logo";

export const metadata: Metadata = {
  title: "Complēre - onboarding",
  description: "A little about you",
};

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <GradientMediumContainer>
      <div className="container mx-auto h-full px-8 py-10">
        {/* Header with Logo */}
        <div className="mb-16">
          <Logo />
        </div>

        {/* Main Content */}
        <div className="relative">
          {/* Content will be provided by each page */}
          {children}
        </div>
      </div>
    </GradientMediumContainer>
  );
}
