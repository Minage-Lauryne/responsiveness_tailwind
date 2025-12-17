"use client";

import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { api } from "@/trpc/react";
import { LoadingCardSpinner } from "@/features/shared/loading-spinner";
import { CurrentSubscriptionStatus } from "./status";
import { RetiredSubscriptions } from "./retired";
import { PromotionalPricing } from "./promotional-pricing";
import { TeamBilling } from "./team-billing";
import { TeamSubscriptionDetails } from "./team-subscription-details";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, User } from "lucide-react";

export function BillingContainer() {
  const router = useRouter();
  const utils = api.useUtils();

  const { data, isLoading: subscriptionsAreLoading } =
    api.billing.listSubscriptions.useQuery();
  

  const { data: userInfo } = api.me.get.useQuery();

  const { data: organizationMembers } = api.billing.getOrganizationMembers.useQuery(
    undefined,
    { enabled: !!userInfo?.activeOrganization?.id }
  );

  const subscribeMutation = api.billing.subscribe.useMutation({
    onError(err) {
      toast.error(`An error occured subscribing: ${err.message}`);
    },
    onSuccess(url) {
      router.push(url);
    },
  });

  const manageSubscriptionMutation = api.billing.manageSubscription.useMutation(
    {
      onError(err) {
        toast.error(`An error occured subscribing: ${err.message}`);
      },
      onSuccess(url) {
        router.push(url);
      },
    },
  );

  const allocateSeatMutation = api.billing.allocateSeat.useMutation({
    onError(err) {
      toast.error(`Error allocating seat: ${err.message}`);
    },
    onSuccess() {
      toast.success("Seat allocated successfully");
      void utils.billing.listSubscriptions.invalidate();
    },
  });

  const revokeSeatMutation = api.billing.revokeSeat.useMutation({
    onError(err) {
      toast.error(`Error revoking seat: ${err.message}`);
    },
    onSuccess() {
      toast.success("Seat revoked successfully");
      void utils.billing.listSubscriptions.invalidate();
    },
  });

  if (subscriptionsAreLoading || !data || !userInfo) {
    return <LoadingCardSpinner />;
  }

  const { subscriptionsByStatus, trialEndsAt, freeForever, seatUsage } = data;

  const appHref = new window.URL(window.location.href);
  appHref.pathname = "/app";

  const successHref = new window.URL(window.location.href);
  successHref.pathname = "/app/success";

  const runningSubscription =
    subscriptionsByStatus.active[0] ||
    subscriptionsByStatus.canceled[0] ||
    null;

  // Check if user is in organization context and is admin
  const activeOrganization = userInfo.activeOrganization;
  const isOrgAdmin = userInfo.activeOrganizationMember?.role === "ADMIN";
  const isInOrganization = !!activeOrganization && activeOrganization.id !== null;

  // Check if organization has a team subscription
  const hasTeamSubscription = subscriptionsByStatus.active.some((sub: any) => sub.type === "Team") || 
                              subscriptionsByStatus.canceled.some((sub: any) => sub.type === "Team");
  
  const teamSubscription = subscriptionsByStatus.active.find((sub: any) => sub.type === "Team") || 
                          subscriptionsByStatus.canceled.find((sub: any) => sub.type === "Team") || 
                          null;

  // If user has a running subscription, show current status
  if (runningSubscription) {
    return (
      <>
        <h2 className="text-2xl font-bold">Your subscription</h2>
        <CurrentSubscriptionStatus
          subscription={runningSubscription}
          trialEndsAt={trialEndsAt}
          freeForever={freeForever}
          seatUsage={seatUsage}
          isLoading={
            manageSubscriptionMutation.isLoading || subscribeMutation.isLoading
          }
          onSubscribeAction={() =>
            subscribeMutation.mutate({
              redirects: {
                success: successHref.toString(),
                cancel: window.location.href,
              },
            })
          }
          onManageAction={() =>
            manageSubscriptionMutation.mutate({
              redirects: {
                success: appHref.toString(),
                cancel: window.location.href,
              },
            })
          }
        />

        {/* Show team subscription management if user has team subscription */}
        {teamSubscription && teamSubscription.type === "Team" && isOrgAdmin && (
          <TeamSubscriptionDetails
            subscription={teamSubscription}
            organizationMembers={organizationMembers || []}
            onAllocateSeat={(userId) => 
              allocateSeatMutation.mutate({ 
                userId, 
                subscriptionId: teamSubscription.id 
              })
            }
            onRevokeSeat={(userId) => 
              revokeSeatMutation.mutate({ 
                userId, 
                subscriptionId: teamSubscription.id 
              })
            }
            onInviteMembers={() => router.push("/app/organization-admin/invitations")}
          />
        )}

        {/* If user is org admin but doesn't have team subscription, show option to buy team seats */}
        {isInOrganization && isOrgAdmin && !hasTeamSubscription && runningSubscription.type === "Individual" && (
          <div className="mt-8">
            <h3 className="text-xl font-bold mb-4">Add Team Subscription</h3>
            <p className="text-sm text-muted-foreground mb-4">
              You have a personal subscription. As an organization admin, you can also purchase team seats for your organization members.
            </p>
            <TeamBilling
              organizationId={activeOrganization.id}
              currentMembers={activeOrganization.memberCount || 0}
            />
          </div>
        )}

        {subscriptionsByStatus.retired.length > 0 && (
          <>
            <h2 className="text-xl font-bold">Your past subscriptions</h2>
            <RetiredSubscriptions subscriptions={subscriptionsByStatus.retired} />
          </>
        )}
      </>
    );
  }

  // If no subscription, show subscription options
  return (
    <>
      <h2 className="text-2xl font-bold ">Choose your subscription</h2>
      {isInOrganization && isOrgAdmin ? (
        <Tabs defaultValue="individual" className="w-full ">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="individual" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Individual
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team
            </TabsTrigger>
          </TabsList>
          <TabsContent value="individual" className="mt-6">
            <div className="space-y-6">
                 <div>
                <h2 className="text-gray-900 mb-1 font-black text-xl">Individual Subscription</h2>
                <p className="text-gray-600">Subscribe for yourself only. Perfect for personal use.</p>
              </div>

         
                <PromotionalPricing
                  onSubscribe={(plan) =>
                    subscribeMutation.mutate({
                      plan: plan as "Standard" | "First100" | "FirstYear",
                      type: "Individual",
                      redirects: {
                        success: successHref.toString(),
                        cancel: window.location.href,
                      },
                    })
                  }
                  isLoading={subscribeMutation.isLoading}
                />
           
            </div>
          </TabsContent>
          <TabsContent value="team" className="mt-6">
            <TeamBilling
              organizationId={activeOrganization.id as string}
              currentMembers={activeOrganization.memberCount || 0}
            />
          </TabsContent>
        </Tabs>
      ) : (
        // Regular individual subscription
        <PromotionalPricing
          onSubscribe={(plan) =>
            subscribeMutation.mutate({
              plan: plan as "Standard" | "First100" | "FirstYear",
              type: "Individual",
              redirects: {
                success: successHref.toString(),
                cancel: window.location.href,
              },
            })
          }
          isLoading={subscribeMutation.isLoading}
        />
      )}

      {subscriptionsByStatus.retired.length > 0 && (
        <>
          <h2 className="text-xl font-bold">Your past subscriptions</h2>
          <RetiredSubscriptions subscriptions={subscriptionsByStatus.retired} />
        </>
      )}
    </>
  );
}
