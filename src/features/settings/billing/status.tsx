"use client";

import { type Subscription } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingButton } from "@/components/ui/button";
import { isBefore } from "date-fns";
import { RoleOnlyView } from "@/components/organization/role-guard";
import { StatusPill } from "@/components/status-pill";

export function CurrentSubscriptionStatus({
  subscription,
  trialEndsAt,
  freeForever,
  isLoading,
  onSubscribeAction,
  onManageAction,
  seatUsage,
}: {
  subscription: Subscription | null;
  trialEndsAt: Date | null;
  freeForever: boolean;
  isLoading: boolean;
  onSubscribeAction: () => void;
  onManageAction: () => void;
  seatUsage?: {
    currentMembers: number;
    pendingInvitations: number;
    totalUsed: number;
  };
}) {
  if (subscription) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Plan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>
              {subscription.status === "active"
                ? "Renews automatically"
                : "Ends"}
            </TableHead>
            <TableHead>Seats</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>{subscription.plan}</TableCell>
            <TableCell><StatusPill status={subscription.status}/></TableCell>
            <TableCell>
              {subscription.periodEnd.toLocaleDateString("en-US")}
            </TableCell>
            <TableCell>
              {subscription.type === "Team" && seatUsage ? (
                <div>
                  <span className="font-medium">
                    {seatUsage.totalUsed} / {subscription.seats}
                  </span>
                  {seatUsage.pendingInvitations > 0 && (
                    <div className="text-xs text-muted-foreground">
                      ({seatUsage.currentMembers} active,{" "}
                      {seatUsage.pendingInvitations} pending)
                    </div>
                  )}
                </div>
              ) : subscription.type === "Individual" ? (
                <span className="text-muted-foreground">Personal</span>
              ) : (
                subscription.seats
              )}
            </TableCell>
            <TableCell>
              <RoleOnlyView allowedRoles={["ADMIN"]}>
                <LoadingButton isLoading={isLoading} onClick={onManageAction}
                className="mt-1"
                >
                  Manage subscription
                </LoadingButton>
              </RoleOnlyView>

            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }
  if (freeForever) {
    return <p>Your organization has free usage.</p>;
  }
  return (
    <>
      <p>
        Your organization currently does not have a subscription.&nbsp;
        {trialEndsAt && isBefore(new Date(), trialEndsAt) ? (
          <span>
            The free trial period ends at {trialEndsAt.toLocaleString("en-US")}.
          </span>
        ) : null}
      </p>
      <div>
        <LoadingButton
          onClick={() => onSubscribeAction()}
          isLoading={isLoading}
        >
          Subscribe
        </LoadingButton>
      </div>
    </>
  );
}
