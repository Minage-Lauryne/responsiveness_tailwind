"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Loader2, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface InvitationAcceptFlowProps {
  invitationId: string;
  invitationEmail: string;
  organizationName: string;
  currentUserEmail: string;
}

export function InvitationAcceptFlow({
  invitationId,
  invitationEmail,
  organizationName,
  currentUserEmail,
}: InvitationAcceptFlowProps) {
  const [step, setStep] = useState<"initial" | "code-sent" | "success">("initial");
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const requestLink = api.userEmails.requestLinkEmail.useMutation({
    onSuccess: () => {
      setStep("code-sent");
      setError(null);
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const verifyAndLink = api.userEmails.verifyAndLinkEmail.useMutation({
    onSuccess: () => {
      setStep("success");
      setError(null);
      // Redirect after a short delay to show success message
      setTimeout(() => {
        router.push("/app?invited=true");
      }, 1500);
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const handleRequestCode = () => {
    setError(null);
    requestLink.mutate({
      email: invitationEmail,
      invitationId,
    });
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (verificationCode.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    verifyAndLink.mutate({
      email: invitationEmail,
      code: verificationCode,
      invitationId,
    });
  };

  if (step === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle className="text-center">Email Linked Successfully!</CardTitle>
            <CardDescription className="text-center">
              You can now access {organizationName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              Redirecting you to the app...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Link Email to Your Account</CardTitle>
          <CardDescription>
            You're signed in as <strong>{currentUserEmail}</strong>, but this invitation was sent to{" "}
            <strong>{invitationEmail}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "initial" && (
            <>
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertTitle>Link this email to your account</AlertTitle>
                <AlertDescription>
                  To accept this invitation and join <strong>{organizationName}</strong>, you'll need to
                  verify that you own <strong>{invitationEmail}</strong>. We'll send a verification code
                  to that email address.
                </AlertDescription>
              </Alert>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleRequestCode}
                disabled={requestLink.isLoading}
                className="w-full"
              >
                {requestLink.isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending code...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Verification Code
                  </>
                )}
              </Button>

              <div className="text-sm text-muted-foreground text-center">
                A 6-digit code will be sent to {invitationEmail}
              </div>
            </>
          )}

          {step === "code-sent" && (
            <>
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Code Sent!</AlertTitle>
                <AlertDescription>
                  We've sent a 6-digit verification code to <strong>{invitationEmail}</strong>. Please
                  check your inbox and enter the code below.
                </AlertDescription>
              </Alert>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Verification Code</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => {
                      // Only allow numbers and limit to 6 digits
                      const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setVerificationCode(value);
                      setError(null);
                    }}
                    maxLength={6}
                    autoFocus
                    disabled={verifyAndLink.isLoading}
                    className="text-center text-2xl tracking-widest"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={verificationCode.length !== 6 || verifyAndLink.isLoading}
                  className="w-full"
                >
                  {verifyAndLink.isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify and Link Email"
                  )}
                </Button>
              </form>

              <div className="flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRequestCode}
                  disabled={requestLink.isLoading}
                >
                  {requestLink.isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Resend Code"
                  )}
                </Button>
              </div>

              <div className="text-sm text-muted-foreground text-center">
                The code will expire in 10 minutes
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
