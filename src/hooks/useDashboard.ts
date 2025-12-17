import { api } from "@/trpc/react";

export function useDashboardStats() {
  const { data: members } = api.organization.listMembers.useQuery({ organizationId: undefined });
  const { data: chats } = api.chat.getHistory.useQuery({ type: "recent", limit: 1 });
  const { data: requests } = api.organization.getJoinRequests.useQuery({ status: "PENDING" });
  const { data: subscriptions } = api.billing.listSubscriptions.useQuery();

  const activeSubscriptionCount = 
    (subscriptions?.subscriptionsByStatus?.active?.length ?? 0) + 
    (subscriptions?.subscriptionsByStatus?.canceled?.length ?? 0);

  return {
    memberCount: members?.length ?? 0,
    chatCount: chats?.length ?? 0,
    requestCount: requests?.length ?? 0,
    subscriptionCount: activeSubscriptionCount,
  };
}