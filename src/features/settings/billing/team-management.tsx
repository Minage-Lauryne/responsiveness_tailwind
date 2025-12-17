"use client";

import { LoadingCardSpinner } from "@/features/shared/loading-spinner";
import { api } from "@/trpc/react";
import { InvitationsList } from "./invitations-list";
import { InviteMemberForm } from "./invite-member-form";
import { MembersList } from "./members-list";
import { SeatUsageIndicator } from "./seat-usage-indicator";

export function TeamManagement() {
  const utils = api.useUtils();
  const {
    data: teamOverview,
    isLoading,
    refetch,
  } = api.team.getTeamOverview.useQuery({});

  const { data: billingData } = api.billing.listSubscriptions.useQuery();

  const handleTeamChange = async () => {
    await Promise.all([
      refetch(),
      utils.billing.listSubscriptions.invalidate(),
    ]);
  };

  if (isLoading || !teamOverview || !billingData) {
    return <LoadingCardSpinner />;
  }

  const runningSubscription =
    billingData.subscriptionsByStatus.active[0] ||
    billingData.subscriptionsByStatus.canceled[0] ||
    null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Team Management</h2>
      </div>

      {/* Seat Usage Overview */}
      <SeatUsageIndicator
        seatInfo={teamOverview.seatInfo}
        subscription={runningSubscription}
        freeForever={billingData.freeForever}
        trialEndsAt={billingData.trialEndsAt}
      />

      {/* Invite New Members */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">Invite New Members</h3>
        <InviteMemberForm
          onInviteSuccess={handleTeamChange}
          seatInfo={teamOverview.seatInfo}
        />
      </div>

      {/* Current Members */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">
          Current Members ({teamOverview.totalMembers})
        </h3>
        <MembersList
          members={teamOverview.members}
          totalMembers={teamOverview.totalMembers}
          onMemberRemoved={handleTeamChange}
        />
      </div>

      {/* Pending Invitations */}
      {teamOverview.totalInvitations > 0 && (
        <div>
          <h3 className="mb-4 text-lg font-semibold">
            Pending Invitations ({teamOverview.totalInvitations})
          </h3>
          <InvitationsList
            invitations={teamOverview.invitations}
            totalInvitations={teamOverview.totalInvitations}
            onInvitationCanceled={handleTeamChange}
          />
        </div>
      )}
    </div>
  );
}
