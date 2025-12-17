"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Mail,
  UserPlus,
  AlertCircle,
  KeyRound,
  Pencil,
} from "lucide-react";
import { FaSpinner } from "react-icons/fa6";
import { ArrowRightIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { GradientContainer } from "@/components/complere/gradient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MarketingPanel } from "@/components/complere/marketing-panel";
import { VerificationCodeInput } from "@/components/ui/verification-code-input";

type Step = "choice" | "enter-email" | "verify-existing" | "success";

export function AcceptInvitationFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationId = searchParams.get("id");

  const [step, setStep] = useState<Step>("choice");
  const [invitedEmail, setInvitedEmail] = useState<string>("");
  const [organizationName, setOrganizationName] = useState<string>("");
  const [existingEmail, setExistingEmail] = useState<string>("");
  const [existingEmailCode, setExistingEmailCode] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const verificationCodeInputRef = useRef<HTMLInputElement | null>(null);

  const { data: invitation, isLoading: isLoadingInvitation } =
    api.invitation.getInvitationDetails.useQuery(
      { invitationId: invitationId ?? "" },
      { enabled: !!invitationId }
    );

  useEffect(() => {
    if (!invitationId) {
      router.push("/signin");
      return;
    }

    if (invitation) {
      setInvitedEmail(invitation.email);
      setOrganizationName(invitation.organizationName);
    }
  }, [invitationId, invitation, router]);

  useEffect(() => {
    if (step === "verify-existing") {
      setTimeout(() => verificationCodeInputRef.current?.focus?.(), 30);
    }
  }, [step]);

  const linkExistingAccountToInvitation =
    api.auth.linkExistingAccountToInvitation.useMutation({
      onSuccess: (data) => {
        setUserId(data.userId);
        setStep("verify-existing");
        setError(null);
        toast.success(`Verification code sent to ${existingEmail}`);
      },
      onError: (error) => {
        setError(error.message);
        toast.error(error.message);
      },
    });

  const verifyExistingEmail =
    api.auth.verifyExistingAccountCode.useMutation({
      onSuccess: () => {
        linkAndAcceptInvitation.mutate({
          userId: userId!,
          existingEmail,
          invitedEmail,
          invitationId: invitationId!,
        });
      },
      onError: (error) => {
        setError(error.message);
        toast.error(error.message);
      },
    });

  const linkAndAcceptInvitation =
    api.auth.linkInvitedEmailAndAcceptInvitation.useMutation({
      onSuccess: () => {
        setStep("success");
        setError(null);
        toast.success("Accounts linked successfully!");
        setTimeout(() => {
          router.push("/signin");
        }, 1400);
      },
      onError: (error) => {
        setError(error.message);
        toast.error(error.message);
      },
    });

  const handleNoExistingAccount = () => {
    router.push(`/register?invite=${invitationId}`);
  };

  const handleYesExistingAccount = () => {
    setStep("enter-email");
    setError(null);
  };

  const handleSubmitExistingEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!existingEmail || !existingEmail.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    if (existingEmail.toLowerCase() === invitedEmail.toLowerCase()) {
      setError(
        "This is the same email you were invited with. Please enter a different email."
      );
      return;
    }
    if (!invitationId) {
      setError("Invalid invitation");
      return;
    }

    linkExistingAccountToInvitation.mutate({
      existingEmail,
      invitedEmail,
      invitationId,
    });
  };

  const submitVerifyExistingCode = () => {
    setError(null);
    if (existingEmailCode.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }
    if (!userId) {
      setError("Session expired. Please start over.");
      return;
    }
    if (!invitationId) {
      setError("Session expired. Please start over.");
      return;
    }
    verifyExistingEmail.mutate({
      userId,
      existingEmail,
      invitedEmail,
      code: existingEmailCode,
      invitationId,
    });
  };

  const handleVerifyExistingCode = (e: React.FormEvent) => {
    e.preventDefault();
    submitVerifyExistingCode();
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 bg-white">
        {isLoadingInvitation ? (
          <div className="rounded-lg bg-white p-8 shadow-md">
            <div className="flex items-center space-x-3">
              <FaSpinner className="h-8 w-8 animate-spin text-slate-600" />
              <div>
                <h3 className="text-lg font-medium">Loading invitation…</h3>
                <p className="text-sm text-muted-foreground">
                  Hang tight while we fetch your invitation.
                </p>
              </div>
            </div>
          </div>
        ) : !invitation ? (
          <Card className="w-full max-w-md shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-rose-500" />
                <CardTitle>Invalid Invitation</CardTitle>
              </div>
              <CardDescription>
                This invitation link is invalid or has expired.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => router.push("/")}>
                  Back to home
                </Button>
                <Button onClick={() => router.push("/support")}>Get help</Button>
              </div>
            </CardContent>
          </Card>
        ) : step === "success" ? (
          <Card className="w-full max-w-md text-center shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-center">
                <CheckCircle2 className="h-14 w-14 text-green-500" />
              </div>
              <CardTitle>You're all set</CardTitle>
              <CardDescription>
                You've successfully accepted the invitation to{" "}
                <strong>{organizationName}</strong>.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Redirecting you to sign in…
              </p>
              <Button onClick={() => router.push("/signin")} className="w-full">
                Sign in now
              </Button>
            </CardContent>
          </Card>
        ) : step === "verify-existing" ? (
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <KeyRound className="h-6 w-6 text-indigo-600" />
                <CardTitle>Verify your existing account</CardTitle>
              </div>
              <CardDescription>
                We sent a 6-digit code to <strong>{existingEmail}</strong>
              </CardDescription>
            </CardHeader>

            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleVerifyExistingCode} className="space-y-4">
                <div>
                  <Label className="sr-only" htmlFor="existing-code">
                    Verification code
                  </Label>

                  <div className="flex justify-center">
                    <VerificationCodeInput
                      value={existingEmailCode}
                      onChange={(val) => {
                        setExistingEmailCode(val.replace(/\D/g, "").slice(0, 6));
                        setError(null);
                      }}
                      onFulfill={submitVerifyExistingCode}
                      ref={verificationCodeInputRef}
                    />
                  </div>
                </div>

                <div className="grid gap-2 mt-2">
                  <Button
                    type="submit"
                    disabled={
                      existingEmailCode.length !== 6 ||
                      verifyExistingEmail.isLoading ||
                      linkAndAcceptInvitation.isLoading
                    }
                    className="w-full"
                  >
                    {verifyExistingEmail.isLoading ||
                    linkAndAcceptInvitation.isLoading ? (
                      <>
                        <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                        {verifyExistingEmail.isLoading ? "Verifying…" : "Linking…"}
                      </>
                    ) : (
                      "Verify & Link"
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep("enter-email")}
                    className="w-full"
                  >
                    Back
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : step === "enter-email" ? (
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Mail className="h-6 w-6 text-sky-600" />
                <CardTitle>Link to an existing account</CardTitle>
              </div>
              <CardDescription>
                Enter the email address of your existing Complēre account
              </CardDescription>
            </CardHeader>

            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Alert className="mb-4">
                <UserPlus className="h-4 w-4" />
                <AlertTitle>Invitation email</AlertTitle>
                <AlertDescription>
                  You were invited with <strong>{invitedEmail}</strong>. 
                  We'll link this to your existing account so you can access all your organizations.
                </AlertDescription>
              </Alert>

              <form onSubmit={handleSubmitExistingEmail} className="space-y-4">
                <div>
                  <Label htmlFor="existing-email">Existing account email</Label>
                  <div className="relative">
                    <Input
                      id="existing-email"
                      type="email"
                      placeholder="you@example.com"
                      value={existingEmail}
                      onChange={(e) => {
                        setExistingEmail(e.target.value);
                        setError(null);
                      }}
                      autoFocus
                      disabled={linkExistingAccountToInvitation.isLoading}
                    />
                    {existingEmail && (
                      <button
                        type="button"
                        aria-label="edit"
                        onClick={() => {
                          const el = document.getElementById(
                            "existing-email"
                          ) as HTMLInputElement | null;
                          el?.focus();
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-1 py-0.5 text-sm text-muted-foreground hover:bg-muted"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Button
                    type="submit"
                    disabled={!existingEmail || linkExistingAccountToInvitation.isLoading}
                    className="w-full"
                  >
                    {linkExistingAccountToInvitation.isLoading ? (
                      <>
                        <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                        Sending code…
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Send verification code
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep("choice")}
                    className="w-full"
                  >
                    Back
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <UserPlus className="h-6 w-6 text-emerald-600" />
                <CardTitle>You're invited to join {organizationName}</CardTitle>
              </div>
              <CardDescription>
                You've been invited to join <strong>{organizationName}</strong>
              </CardDescription>
            </CardHeader>

            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Button
                    onClick={handleYesExistingAccount}
                    className="w-full"
                    size="lg"
                  >
                    Yes, I have an existing account
                  </Button>

                  <Button
                    onClick={handleNoExistingAccount}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    No, this is my first account
                  </Button>
                </div>

                <p className="text-center text-sm text-muted-foreground">
                  You can always link additional email addresses later in your account settings.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <MarketingPanel />
    </div>
  );
}