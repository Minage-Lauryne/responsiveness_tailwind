"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/complere/logo";
import { GradientContainer } from "@/components/complere/gradient";
import { ArrowRightIcon } from "lucide-react";

export function TrialPaywall() {
  const router = useRouter();

  const handleSubscribe = () => {
    router.push("/app/settings/billing");
  };

  return (
    <div className="flex min-h-[600px] w-full items-center justify-center p-4">
      <GradientContainer className="w-full max-w-lg rounded-xl">
        <div className="flex flex-col items-center px-8 py-12 text-center">
          <div className="mb-6">
            <Logo />
          </div>

          <div className="mb-6 flex items-center gap-2 rounded-full bg-white/30 px-4 py-2 backdrop-blur-sm">
            <span className="text-sm font-medium text-gray-800">
              Trial Limit Reached
            </span>
          </div>

          <h2 className="mb-6 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
            Ready to unlock more insights?
          </h2>

          <p className="mb-8 max-w-lg text-xl text-gray-700">
            You've wrapped up your free trial. Upgrade to continue using
            Complēre to inform your strategies, grant decisions, and more.
          </p>

          <div className="mb-10 flex flex-col gap-4 rounded-xl bg-white/40 p-8 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-gray-800">
              <ArrowRightIcon className="h-5 w-5" />
              <div className="font-semibold">Unlock Full Access</div>
            </div>
            <div className="text-left text-gray-700">
              Get unlimited chats, advanced AI analysis, and priority support to
              maximize your impact.
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <Button
              onClick={handleSubscribe}
              className="px-8 py-4 text-lg font-semibold"
              size="lg"
            >
              Subscribe to Complēre Essentials
            </Button>

            <div className="text-center text-sm text-gray-600/80">
              <p>
                Volume discounts available: 10% off for 5 - 10 seats, another
                10% off for 10+ seats. Adjust the quantity on the checkout page
                to see the discount applied.
              </p>
            </div>
          </div>
        </div>
      </GradientContainer>
    </div>
  );
}
