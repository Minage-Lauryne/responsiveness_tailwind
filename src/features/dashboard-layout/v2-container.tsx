"use client";
import { AppSidebar } from "@/components/app-sidebar";
import { BetaBanner } from "@/components/beta-banner";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SubscriptionPromptModal } from "@/components/subscription-prompt-modal";
import { useSubscriptionPrompt } from "@/hooks/use-subscription-prompt";
import { api } from "@/trpc/react";

export function V2Container({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading: userLoading } = api.me.get.useQuery();
  const { shouldShow, hideModal, hasAccess } = useSubscriptionPrompt();

  return (
    <>
      <SidebarProvider defaultOpen={true}>
        <AppSidebar />
        <SidebarInset>
          <BetaBanner />
          <div className="pt-12">{children}</div>
        </SidebarInset>
      </SidebarProvider>

      {/* Subscription prompt modal */}
      <SubscriptionPromptModal
        open={shouldShow}
        onOpenChange={hideModal}
      />
    </>
  );
}