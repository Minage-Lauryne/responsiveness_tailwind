"use client";

import { Button } from "@/components/ui/button";
import { useSignOut } from "@/features/auth/utils";
import Link from "next/link";

export default function WaitlistFooter() {
  const signOut = useSignOut("/signin");

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 flex w-full flex-row justify-between  p-4 ">
      <div className="mx-4 flex  items-center gap-x-4 md:mx-8">
        <p className="text-left text-xs leading-loose text-muted-foreground md:text-sm">
          ©{` `}
          {new Date().getFullYear()}
          {` `} Complere, LLC
        </p>
        |
        <Link
          href="/legal/terms"
          className="text-xs leading-loose text-muted-foreground md:text-sm"
        >
          Terms of Service
        </Link>
        <Link
          href="/legal/privacy"
          className="text-xs leading-loose text-muted-foreground md:text-sm"
        >
          Privacy Policy
        </Link>
      </div>
      <div className="mx-4 flex  items-center gap-x-4 md:mx-8">
        <Button onClick={() => signOut.mutate()} variant="outline">
          Sign Out
        </Button>
        <div>|</div>
        <Link className="underline" href="/">
          Back to Main Site
        </Link>
      </div>
    </div>
  );
}
