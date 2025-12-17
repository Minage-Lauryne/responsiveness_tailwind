"use client";

import * as React from "react";
import { FaSpinner } from "react-icons/fa6";

import { useMutation } from "@tanstack/react-query";
import { CheckCircle, EditIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { VerificationCodeInput } from "@/components/ui/verification-code-input";
import { cn, formatEmail } from "@/lib/utils";
import { api } from "@/trpc/react";
import { BILLIAM_EMAIL_LOCAL_STORAGE_KEY, BILLIAM_IS_BETA_LOCAL_STORAGE_KEY } from "./auth-email-signin";
import { authClient } from "@/lib/auth-client";
import { config } from "@/app/(external)/legal/config";

const SECONDS_TO_RESEND = 59;

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function AuthCodeForm({ className, ...props }: Props) {
  const [email, setEmail] = React.useState<string | null>(null);
  const [verificationCodeInput, setVerificationCodeInput] = React.useState("");
  const [isCodeInvalid, setIsCodeInvalid] = React.useState<boolean | undefined>(undefined);
  const [resendTimer, setResendTimer] = React.useState(SECONDS_TO_RESEND);
  const [canResend, setCanResend] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);


  const verificationCodeInputRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();


  React.useEffect(() => {
    const storedEmail = localStorage.getItem(BILLIAM_EMAIL_LOCAL_STORAGE_KEY);
    if (!storedEmail) {
      router.push(config.loginUrl);
      return;
    }
    setEmail(storedEmail);
  }, [router]);

  const signInWithCodeMutation = useMutation(
    async (props: { email: string; code: string }) => {
      const response = await authClient.signIn.emailOtp({
        email: props.email,
        otp: props.code,
      });
      if (response?.error) {
        throw response.error;
      }  
      return response.data;
    },
    {
      onSuccess: () => {

        setIsSuccess(true);
        setError(null);
        setIsCodeInvalid(false);

        const isBetaStored = localStorage.getItem(BILLIAM_IS_BETA_LOCAL_STORAGE_KEY);
        const isBeta = isBetaStored === "true";

        setTimeout(() => {

          const inviteParam = localStorage.getItem("invite-redirect");
          if (inviteParam) {

            localStorage.removeItem("invite-redirect");
            router.push(`/invite/${inviteParam}`);
            return;
          } 

          const restoreRedirect = localStorage.getItem("restore-redirect");
          if (restoreRedirect) {
            localStorage.removeItem("restore-redirect");
            router.push("/account/restore");
            return;
          }

          if(!isBeta){
            router.push("/waitlist");
            return;
          }
      
          router.push("/app");
        }, 1500); 
      },

      onError: (error) => {
        setIsSuccess(false);
        setIsCodeInvalid(false);
        setError((error as Error).message);
        toast.error(`Oops! the OTP code sent on ${email ?? "your email"} may have expired. Tap 'Resend' for a new one!`);
      },
    }
  );

  const resendCode = api.auth.sendCode.useMutation({
    onSuccess: (resp) => {
      if (resp?.email) localStorage.setItem(BILLIAM_EMAIL_LOCAL_STORAGE_KEY, resp.email);
      if (typeof resp?.isBetaUser !== "undefined") localStorage.setItem(BILLIAM_IS_BETA_LOCAL_STORAGE_KEY, String(!!resp.isBetaUser));
    },
    onError: (error) => {
      setError(error.message);
      toast.error(error.message);
    },
  });

  React.useEffect(() => {
    verificationCodeInputRef.current?.focus();
  }, []);

  React.useEffect(() => {
    if (!canResend && resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      
      return () => clearInterval(interval);
    }

    setCanResend(true);
  }, [resendTimer, canResend]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSuccess(false);
    setError(null);
    await confirmCode();
  }

  function handleOnChange(value: string) {
    setVerificationCodeInput(value);
    if (isCodeInvalid) setIsCodeInvalid(false);
  }

  async function confirmCode() {
    if (
      !email ||
      email.trim().length === 0 ||
      verificationCodeInput.trim().length !== 6
    ) {
      setIsCodeInvalid(true);
      setError("Please enter a 6-digit-code.");
      return;
    }
    setError(null);
    const formattedEmail = formatEmail(email);

    signInWithCodeMutation.mutate({
      email: formattedEmail,
      code: verificationCodeInput,
    });
  }

  function handleResend() {
    if (!email) return;
    const formattedEmail = formatEmail(email);
    resendCode.mutate({ email: formattedEmail });
    setResendTimer(SECONDS_TO_RESEND);
    setCanResend(false);
  }

  return (
    <>
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Verify your email
        </h1>
        <p className="text-muted-foreground">
          We've sent a 6-digit code for you to login to Complēre
        </p>
        {email && (
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            {formatEmail(email)}{" "}
            <EditIcon
              className="ml-2 h-4 w-4 cursor-pointer text-blue-500"
              onClick={() => router.back()}
            />
          </div>
        )}
      </div>
      <div className={cn(" flex flex-col items-center", className)} {...props}>
        <form onSubmit={onSubmit} className="w-full">
          <div className={cn("flex flex-col items-center", className)} {...props}>
            <div className="grid gap-2">
              <div className="grid gap-1">
                <Label className="sr-only" htmlFor="verification-code">
                  Verification Code
                </Label>
                <VerificationCodeInput
                  value={verificationCodeInput}
                  onChange={handleOnChange}
                  onFulfill={confirmCode}
                  ref={verificationCodeInputRef}
                />
                {error && (
                  <div className="text-center text-red-500">
                    {error}
                  </div>
                )}
                {isCodeInvalid && !error && (
                  <div className="text-center text-red-500">
                    Incorrect code
                  </div>
                )}
                <div className="mx-auto mb-4 mt-2 text-center text-sm text-muted-foreground">
                  <button
                    className="flex items-center gap-2 text-blue-500 disabled:text-blue-300"
                    onClick={handleResend}
                    disabled={!canResend || resendCode.isLoading}
                    type="button"
                  >
                    Didn't receive a code? Resend{" "}
                    {!canResend && `(${resendTimer}s)`}
                  </button>
                </div>
              </div>
              <Button
                disabled={
                  verificationCodeInput.trim().length !== 6 ||
                  signInWithCodeMutation.isLoading ||
                  isSuccess
                }
                type="submit"
              >
                {signInWithCodeMutation.isLoading && (
                  <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                )}
                Sign In
              </Button>
              {isSuccess && (
                <div className="flex animate-fade-in items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4" />
                  <span>Success! You're signed in.</span>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </>
  );
} 