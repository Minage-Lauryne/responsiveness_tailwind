"use client";

import { type Subscription } from "@prisma/client";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { isBefore } from "date-fns";

interface SeatUsageIndicatorProps {
  seatInfo: {
    hasAvailableSeats: boolean;
    currentMembers: number;
    pendingInvitations: number;
    totalSeats: number | null;
    isTrialOrFree: boolean;
  };
  subscription: Subscription | null;
  freeForever: boolean;
  trialEndsAt: Date | null;
}

export function SeatUsageIndicator({
  seatInfo,
  subscription,
  freeForever,
  trialEndsAt,
}: SeatUsageIndicatorProps) {
  const { currentMembers, pendingInvitations, totalSeats, isTrialOrFree } =
    seatInfo;
  const totalUsed = currentMembers + pendingInvitations;

  // Determine the status and message
  let statusMessage: string;
  let statusVariant: "default" | "secondary" | "destructive" | "outline";
  let showProgress = true;

  if (freeForever) {
    statusMessage = "Free Organization";
    statusVariant = "secondary";
    showProgress = false;
  } else if (trialEndsAt && isBefore(new Date(), trialEndsAt)) {
    statusMessage = "Free Trial";
    statusVariant = "outline";
    showProgress = false;
  } else if (!subscription || !totalSeats) {
    statusMessage = "No Active Subscription";
    statusVariant = "destructive";
    showProgress = false;
  } else {
    const remaining = totalSeats - totalUsed;
    if (remaining <= 0) {
      statusMessage = "Seat Limit Reached";
      statusVariant = "destructive";
    } else if (remaining <= 2) {
      statusMessage = "Nearly Full";
      statusVariant = "outline";
    } else {
      statusMessage = "Active Subscription";
      statusVariant = "default";
    }
  }

  const progressPercentage = totalSeats
    ? Math.min((totalUsed / totalSeats) * 100, 100)
    : 0;

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Seat Usage</h3>
          <p className="text-sm text-muted-foreground">
            {currentMembers} active member{currentMembers !== 1 ? "s" : ""}
            {pendingInvitations > 0 && (
              <span>
                , {pendingInvitations} pending invitation
                {pendingInvitations !== 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>
        <Badge variant={statusVariant}>{statusMessage}</Badge>
      </div>

      {showProgress && totalSeats && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>
              {totalUsed} of {totalSeats} seats used
            </span>
            <span>{totalSeats - totalUsed} remaining</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          {progressPercentage >= 90 && (
            <p className="text-sm text-destructive">
              You're approaching your seat limit. Consider upgrading your
              subscription to add more members.
            </p>
          )}
        </div>
      )}

      {isTrialOrFree && (
        <p className="text-sm text-muted-foreground">
          {freeForever
            ? "You can invite unlimited members with your free organization."
            : "You can invite unlimited members during your trial period."}
        </p>
      )}

      {!subscription &&
        !freeForever &&
        (!trialEndsAt || !isBefore(new Date(), trialEndsAt)) && (
          <p className="text-sm text-destructive">
            You need an active subscription to invite new members.
          </p>
        )}
    </div>
  );
}
