import { headers as getHeaders } from "next/headers";

import { FadeInSection } from "@/components/ui/fade-in";
import { CTA } from "@/features/brand/cta";
import { FAQ } from "@/features/brand/faq";
import { BrandFooter } from "@/features/brand/footer";
import { Hero } from "@/features/brand/hero";
import { Problem } from "@/features/brand/problem";
import { SolutionIntro } from "@/features/brand/solution-intro";
import { Solutions } from "@/features/brand/solutions";
import { UpcomingWorkshops } from "@/features/brand/upcoming-workshops";
import { auth } from "@/lib/auth";

export default async function LandingPage() {
  const hasSession = !!(await auth.api.getSession({
    headers: await getHeaders(),
  }));

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto px-2 sm:px-4">
        <Hero hasSession={hasSession} />
        <FadeInSection>
          <Problem />
        </FadeInSection>
        <SolutionIntro />

        <Solutions />

        <FadeInSection>
          <UpcomingWorkshops />
        </FadeInSection>

        <FAQ />
        <FadeInSection>
          <CTA />
        </FadeInSection>

        <BrandFooter />
      </div>
    </div>
  );
}
