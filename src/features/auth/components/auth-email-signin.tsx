"use client";

import * as React from "react";
import { FaSpinner } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, formatEmail } from "@/lib/utils";
import { getEmailData } from "@/lib/utils/email";
import { api } from "@/trpc/react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { config } from "@/app/(external)/legal/config";

export const BILLIAM_EMAIL_LOCAL_STORAGE_KEY = "billiam-email";
export const BILLIAM_IS_BETA_LOCAL_STORAGE_KEY = "billiam-is-beta";

export function AuthEmailSignInForm({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email");
  const inviteParam = searchParams.get("invite");
  const [email, setEmail] = React.useState(emailParam ?? "");
  const [error, setError] = React.useState<string | null>(null);
  const [warning, setWarning] = React.useState<string | null>(null);
  const router = useRouter();

  React.useEffect(() => {
    if (inviteParam) {
      localStorage.setItem("invite-redirect", inviteParam);
    }
  }, [inviteParam]);

  const sendCode = api.auth.sendCode.useMutation({
    onSuccess: (resp) => {
      localStorage.setItem(BILLIAM_EMAIL_LOCAL_STORAGE_KEY, resp.email);
      localStorage.setItem(BILLIAM_IS_BETA_LOCAL_STORAGE_KEY, String(!!resp.isBetaUser));
      router.push("/signin/code");
    },
    onError: (error) => {
      setError(error.message);
      setWarning(null);
    },
  });

  const isEmailValid = email.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setWarning(null);
    if (!isEmailValid) return;

    const formattedEmail = formatEmail(email);
    try {
      const emailData = getEmailData(formattedEmail);
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
      sendCode.mutate({ email: formattedEmail });
    } catch (err) {
      setError("Invalid email");
    }
  }

  return (
    <div className="min-w-xl mx-auto flex flex-col gap-y-4 p-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold">Sign in to Complēre</h1>
        <p className="text-sm text-muted-foreground">Welcome back! Enter your email</p>
      </div>
      <form onSubmit={handleSubmit} className="w-full">
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
              disabled={sendCode.isLoading}
              className="min-w-xl bg-white"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError(null);
                setWarning(null);
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
            disabled={!isEmailValid || sendCode.isLoading}
            type="submit"
            variant="default"
            effect="expandIcon"
            icon={ArrowRightIcon}
            iconPlacement="right"
          >
            {sendCode.isLoading ? <FaSpinner className="animate-spin mr-2" /> : null}
            Continue
          </Button>
        </div>
      </form>
      <div className="text-center text-sm text-muted-foreground mt-4">
        New to Complēre? <Link href={config.registerUrl} className="underline">Register</Link>
      </div>
    </div>
  );
}