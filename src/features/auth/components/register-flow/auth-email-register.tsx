"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { cn, formatEmail } from "@/lib/utils";
import { getEmailData } from "@/lib/utils/email";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/trpc/react"; 
import { ArrowRightIcon } from "lucide-react";

import Link from "next/link";
import { config } from "@/app/(external)/legal/config";

export const BILLIAM_EMAIL_LOCAL_STORAGE_KEY = "billiam-email";

export function AuthEmailRegisterForm({ className }: { className?: string }){
  const searchParams = useSearchParams();
  const inviteParam = searchParams.get("invite");
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [warning, setWarning] = React.useState<string | null>(null);
  const router = useRouter();
  const isEmailValid = email.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  React.useEffect(() => {
    if (inviteParam) {
      localStorage.setItem("invite-redirect", inviteParam);
    }
  }, [inviteParam]);

  const checkEmailQuery = api.auth.checkEmailExists.useQuery(
    { email: formatEmail(email) },
    {
      enabled: false,
    }
  );

  async function signUpWithEmail() {
    setError(null);
    setWarning(null);

    if (!isEmailValid) {
      setError("Please enter a valid email");
      return;
    }

    const formatted = formatEmail(email);
    let emailData;
    try {
      emailData = getEmailData(formatted);
    } catch {
      setError("Invalid email format");
      return;
    }

    if (emailData.type === "temporary") {
      setError("Temporary emails are not allowed");
      return;
    }

    if (emailData.type === "public") {
      setWarning(
        "Please use a work email. Most likely, personal emails will not be approved for beta use unless you contact a Complēre member directly"
      );
      return;
    }

    try {
      const result = await checkEmailQuery.refetch();
      if (result.data?.exists) {
        setError("This email is already registered. Please log in instead.");
        return;
      }
    } catch (error) {
      console.error("Email check failed:", error);
      toast.error("Unable to verify email. Please try again.");
      return;
    }

    localStorage.setItem(BILLIAM_EMAIL_LOCAL_STORAGE_KEY, formatted);
    router.push(`/onboarding?email=${encodeURIComponent(formatted)}`);
  }

  return (
    <div className={cn("min-w-xl mx-auto flex flex-col gap-y-4 p-6", className)}>
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold">Register for the Complēre Beta</h1>
        <p className="text-sm text-muted-foreground">
          For initial registration, enter your work email. The Complēre team will review your request for access.
        </p>
      </div>
      <form
          onSubmit={async (event) => {
            event.preventDefault();
            return signUpWithEmail();
          }}
          className="w-full"
        >        
        <div className="grid gap-2">
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="email">
              Email
            </Label>
            <Input
                  id="email"
                  autoFocus
                  placeholder="name@example.com"
                  type="email"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  disabled={false}
                  className="min-w-xl bg-white"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                  }}
            />
          </div>
          {error && (
            <div className="text-center text-sm text-red-500">
              {error}
            </div>
          )}
          {warning && (
            <div className="text-center text-sm text-yellow-500">
              {warning}
            </div>
            )}
          <Button 
          disabled={!isEmailValid}
          type="submit"
          variant="default"
          effect="expandIcon"
          icon={ArrowRightIcon}
          iconPlacement="right"
          >
            Join Beta
          </Button>
        </div>
      </form>
      <div className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href={config.loginUrl} className="underline">
          Login
        </Link>
      </div>
    </div>
  );
}