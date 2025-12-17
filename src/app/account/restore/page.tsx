"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { USER_DELETION_CONSTANTS, canAppeal, getAppealWindowEndDate } from "@/lib/utils/user-deletion";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function RestoreAccountPage() {
  const [isRequesting, setIsRequesting] = useState(false);
  const [appealMessage, setAppealMessage] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();
  const { data: restorationRequest, refetch } = api.user.getMyRestorationRequest.useQuery();

  const requestRestorationMutation = api.user.requestRestoration.useMutation({
    onSuccess: () => {
      toast.success("Restoration request submitted successfully!");
      void refetch();
    },
    onError: (error) => {
      if (error.message?.includes("not deleted")) {
        toast.info("Your account has already been restored! Let's set up your workspace.");
        setTimeout(() => {
          router.push("/onboarding/organization");
        }, 1500);
      } else {
        toast.error(error.message || "Failed to submit restoration request");
      }
      setIsRequesting(false);
    },
  });

  const appealMutation = api.user.appealRejection.useMutation({
    onSuccess: () => {
      toast.success("Appeal submitted successfully! An admin will review it.");
      setAppealMessage("");
      void refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit appeal");
    },
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await authClient.getSession();
        if (!session?.data?.session) {
          localStorage.setItem("restore-redirect", "true");
          router.push("/signin");
          return;
        }
        setIsCheckingAuth(false);
      } catch (err) {
        localStorage.setItem("restore-redirect", "true");
        router.push("/signin");
      }
    };

    void checkAuth();
  }, [router]);

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Loading....</p>
        </div>
      </div>
    );
  }

  const handleRequestRestoration = () => {
    setIsRequesting(true);
    requestRestorationMutation.mutate();
  };

  const handleSubmitAppeal = () => {
    if (!restorationRequest) return;
    appealMutation.mutate({
      requestId: restorationRequest.id,
      message: appealMessage,
    });
  };

  const renderStatus = () => {
    if (!restorationRequest) {
      return (
        <>
          <CardHeader>
            <CardTitle>Account Deleted</CardTitle>
            <CardDescription>
              Your account has been deleted and is currently in a {USER_DELETION_CONSTANTS.GRACE_PERIOD_DAYS}-day grace period.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You can request to restore your account within the grace period. An administrator
              will review your request and restore your personal account along with your analyses.
            </p>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleRequestRestoration}
              disabled={isRequesting}
              className="w-full"
            >
              {isRequesting ? "Requesting..." : "Request Account Restoration"}
            </Button>
          </CardFooter>
        </>
      );
    }

    if (restorationRequest.status === "PENDING") {
      return (
        <>
          <CardHeader>
            <CardTitle>Request Pending</CardTitle>
            <CardDescription>
              Your restoration request is awaiting admin approval
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your request was submitted{" "}
              {formatDistanceToNow(new Date(restorationRequest.requestedAt), {
                addSuffix: true,
              })}
              . An administrator will review it shortly.
            </p>
            <p className="text-sm text-muted-foreground">
              You will receive an email notification once your request has been reviewed.
            </p>
          </CardContent>
        </>
      );
    }

    if (restorationRequest.status === "APPROVED") {
      return (
        <>
          <CardHeader>
            <CardTitle>Account Restored</CardTitle>
            <CardDescription>
              Your personal workspace has been successfully restored
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm font-medium">What has been restored:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Your personal workspace</li>
                <li>Your personal analyses</li>
              </ul>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium">What was NOT restored:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Your chats were permanently deleted and cannot be recovered</li>
                <li>Your organization memberships were removed</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-2">
                You can rejoin organizations or create new ones in the next step.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => (window.location.href = "/onboarding/organization")}
              className="w-full"
            >
              Access Account
            </Button>
          </CardFooter>
        </>
      );
    }

    if (restorationRequest.status === "REJECTED") {
      const canSubmitAppeal = canAppeal(
        restorationRequest.status,
        restorationRequest.resolvedAt,
        restorationRequest.appealedAt
      );
      const appealWindowEnd = restorationRequest.resolvedAt 
        ? getAppealWindowEndDate(new Date(restorationRequest.resolvedAt))
        : null;

      return (
        <>
          <CardHeader>
            <CardTitle>Request Rejected</CardTitle>
            <CardDescription>
              Your restoration request was not approved
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {restorationRequest.rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-sm mb-2 text-red-900">Reason for Rejection:</h4>
                <p className="text-sm text-red-800">{restorationRequest.rejectionReason}</p>
              </div>
            )}

            {restorationRequest.appealedAt ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-sm mb-2 text-blue-900">
                  Appeal Submitted
                </h4>
                <p className="text-sm text-blue-800 mb-3">
                  Your appeal was submitted{" "}
                  {formatDistanceToNow(new Date(restorationRequest.appealedAt), {
                    addSuffix: true,
                  })}
                  . An administrator will review it and respond.
                </p>
                <div className="bg-white rounded p-3 text-sm">
                  <p className="font-medium mb-1">Your Appeal:</p>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {restorationRequest.appealMessage}
                  </p>
                </div>
              </div>
            ) : canSubmitAppeal ? (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-medium text-sm mb-2 text-amber-900">
                    You Can Appeal This Decision
                  </h4>
                  <p className="text-sm text-amber-800">
                    You have until{" "}
                    {appealWindowEnd
                      ? formatDistanceToNow(appealWindowEnd, { addSuffix: true })
                      : "soon"}{" "}
                    to submit an appeal. Explain why you need your account restored and our team will review your request again.
                  </p>
                </div>

                <div className="space-y-3">
                  <label htmlFor="appeal-message" className="text-sm font-medium block">
                    Why do you need your account restored?
                  </label>
                  <textarea
                    id="appeal-message"
                    value={appealMessage}
                    onChange={(e) => setAppealMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === ' ') {
                        e.stopPropagation();
                      }
                    }}
                    placeholder="Explain your situation and why you need your account back..."
                    className="w-full min-h-[120px] px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-y"
                    disabled={appealMutation.isPending}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                  />
                  {appealMessage.length > 0 && appealMessage.length < 20 && (
                    <p className="text-xs text-red-500">Appeal message must be at least 20 characters</p>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  The 48-hour appeal window has closed. Your account will remain in a rejected state 
                  until the original 30-day grace period expires. If you have questions, please contact 
                  support@complere.ai
                </p>
              </div>
            )}
          </CardContent>
          {canSubmitAppeal && !restorationRequest.appealedAt && (
            <CardFooter>
              <Button
                onClick={handleSubmitAppeal}
                disabled={appealMutation.isPending || appealMessage.length < 20}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {appealMutation.isPending ? "Submitting Appeal..." : "Submit Appeal"}
              </Button>
            </CardFooter>
          )}
        </>
      );
    }

    if (restorationRequest.status === "REJECTED_FINAL") {
      return (
        <>
          <CardHeader>
            <CardTitle>Appeal Rejected - Final Decision</CardTitle>
            <CardDescription>
              Your appeal has been reviewed and denied
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {restorationRequest.rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-sm mb-2 text-red-900">Decision:</h4>
                <p className="text-sm text-red-800 whitespace-pre-wrap">{restorationRequest.rejectionReason}</p>
              </div>
            )}
            
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                <strong>This decision is final.</strong> Your restoration request has been permanently rejected. 
                Your account will remain deleted and you have exhausted all appeal options.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                If the {USER_DELETION_CONSTANTS.GRACE_PERIOD_DAYS}-day grace period has not yet expired, your data will be 
                retained until that date. After that, it will be permanently deleted.
              </p>
            </div>
            
            <p className="text-sm text-muted-foreground">
              If you have questions about this decision, please contact support@complere.ai
            </p>
          </CardContent>
        </>
      );
    }

    if (restorationRequest.status === "EXPIRED") {
      return (
        <>
          <CardHeader>
            <CardTitle>Request Expired</CardTitle>
            <CardDescription>
              The {USER_DELETION_CONSTANTS.GRACE_PERIOD_DAYS}-day grace period has expired
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your restoration request has expired because the {USER_DELETION_CONSTANTS.GRACE_PERIOD_DAYS}-day grace period ended. Your
              account and data have been permanently deleted.
            </p>
            <p className="text-sm text-muted-foreground">
              If you would like to use Complēre again, you can create a new account.
            </p>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => (window.location.href = "/register")}
              className="w-full"
            >
              Create New Account
            </Button>
          </CardFooter>
        </>
      );
    }

    return null;
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">{renderStatus()}</Card>
    </div>
  );
}