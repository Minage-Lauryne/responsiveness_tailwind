"use client";

import { GradientMediumContainer } from "@/components/complere/gradient-medium";
import { api } from "@/trpc/react";
import WaitlistFooter from "./waitlist-footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function WaitlistContents() {
  const { data: me } = api.me.get.useQuery();

  return (
    <GradientMediumContainer>
      <div className="container relative hidden  flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <div className="prose flex  flex-1 flex-col items-start gap-8 p-8 lg:p-16">
          {me?.isBetaUser ? (
            // Beta user welcome message
            <>
              <h1>Welcome to Complēre Beta! 🎉</h1>
              <h3>You're now part of our exclusive beta program</h3>
              <div className="ml-4">
                <p>
                  Welcome to Complere! We're thrilled to have you join our beta
                  program. We're still working on perfecting the experience, but
                  we're excited for you to try out what we've built so far.
                </p>

                {me?.email && (
                  <p>
                    If you encounter any issues or have feedback, please don't
                    hesitate to contact us at{" "}
                    <strong>support@complere.ai</strong>
                  </p>
                )}

                <div className="mt-6">
                  <Link href="/app">
                    <Button
                      size="lg"
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Get Started
                    </Button>
                  </Link>
                </div>
              </div>
            </>
          ) : (
            // Regular waitlist message
            <>
              <h1>Congratulations! </h1>
              <h3>You have successfully joined Complēre's waitlist</h3>
              <div className="ml-4">
                <p>Complēre is currently in private beta. </p>

                {me?.email && (
                  <p>
                    We will notify you at
                    <strong className="ml-1">{me.email}</strong> when your
                    workspace is ready.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <WaitlistFooter />
    </GradientMediumContainer>
  );
}
