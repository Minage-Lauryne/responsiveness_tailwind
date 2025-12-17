"use client";

import { GradientMediumContainer } from "@/components/complere/gradient-medium";
import { api } from "@/trpc/react";
import { Footer } from "@/features/dashboard-layout/footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Success() {
  const { data: me } = api.me.get.useQuery();

  return (
    <GradientMediumContainer>
      <div className="container relative hidden  flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <div className="prose flex  flex-1 flex-col items-start gap-8 p-8 lg:p-16">
          <h1>Welcome to Complēre Essentials! 🎉</h1>
          <h3>Your payment was successful and you're ready to get started</h3>
          <div className="ml-4">
            <p>
              Congratulations! You now have access to Complēre Essentials. We're
              excited to help you accelerate your research and analysis
              workflow.
            </p>

            <p>
              Your subscription includes unlimited evaluations, priority
              support, and access to all our latest features. Let's get you
              started!
            </p>

            {me?.email && (
              <p>
                If you have any questions or need assistance getting started,
                please don't hesitate to contact us at{" "}
                <strong>support@complere.ai</strong>
              </p>
            )}

            <div className="mt-6">
              <Link href="/app">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Start Using Essentials
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0">
        <Footer />
      </div>
    </GradientMediumContainer>
  );
}
