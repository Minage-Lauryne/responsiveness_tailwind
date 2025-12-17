"use client";

import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Crown, Clock, Check, ArrowRight, X } from "lucide-react";
import { GradientContainer } from "@/components/complere/gradient";
import { FaCrown } from "react-icons/fa";

interface SubscriptionPromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscriptionPromptModal({ open, onOpenChange }: SubscriptionPromptModalProps) {
  const router = useRouter();
  const { data: subscriptionAccess } = api.billing.getUserSubscriptionAccess.useQuery();
  const { data: availablePricing, isLoading: pricingLoading } = api.billing.getAvailablePricing.useQuery();

  const handleSubscribe = () => {
    onOpenChange(false);
    router.push("/app/settings/billing");
  };

  const handleDismiss = () => {
    onOpenChange(false);
    // Store dismissal in localStorage to not show again for a while
    try {
      localStorage.setItem("subscription-prompt-dismissed", Date.now().toString());
    } catch (error) {
      console.warn("Could not save dismissal to localStorage");
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      // When dialog is closed (either via X button or ESC), treat it as dismissal
      // Store dismissal in localStorage
      try {
        localStorage.setItem("subscription-prompt-dismissed", Date.now().toString());
      } catch (error) {
        console.warn("Could not save dismissal to localStorage");
      }
    }
    // Always update the parent component's state
    onOpenChange(open);
  };

  // Don't show if user already has subscription access
  if (subscriptionAccess?.hasAccess) {
    return null;
  }

  // Don't show if pricing is still loading
  if (pricingLoading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-0 [&>button]:cursor-pointer">
        <GradientContainer className="w-full rounded-lg">
          <div className="relative p-8">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="h-4 w-4 text-gray-700" />
            </button>

            {/* Header with crown icon */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="mb-4 p-3 bg-white/30 rounded-full backdrop-blur-sm">
                {availablePricing?.plan === "First100" ? (
                  <FaCrown className="h-8 w-8 text-golden " />
                ) : (
                  <Sparkles className="h-8 w-8 text-blue-600" />
                )}
              </div>
              
              <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">
                {availablePricing?.plan === "First100" 
                  ? "Become a Founding Member!" 
                  : "Unlock Full Access! ✨"
                }
              </DialogTitle>
              
              <DialogDescription className="text-gray-700 text-lg">
                {availablePricing?.plan === "First100" 
                  ? "Join the first 100 members and lock in exclusive pricing for the first year!"
                  : "Get unlimited access to Complēre's powerful AI research tools"
                }
              </DialogDescription>
            </div>

            {/* Promotional content */}
            {availablePricing?.plan === "First100" ? (
              <div className="space-y-4 mb-6">
                {/* Price highlight */}
                <div className="text-center p-4 bg-white/40 rounded-xl backdrop-blur-sm">
                  <div className="text-3xl font-bold text-gray-900">
                    ${availablePricing.promotionalPrice}
                    <span className="text-lg text-gray-600 line-through ml-2">
                      ${availablePricing.originalPrice}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 mt-1">for the first year</div>
                </div>

                {/* Limited offer warning */}
                <div className="flex items-center gap-2 p-3 bg-orange-100/60 rounded-lg backdrop-blur-sm">
                  <Clock className="h-5 w-5 text-orange-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-orange-800">
                    Limited to first 100 members only
                  </span>
                </div>

                {/* Benefits */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-gray-700">Unlimited AI-powered research</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-gray-700">Priority support & early access</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-gray-700">Lifetime founding member price</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                {/* Standard pricing */}
                <div className="text-center p-4 bg-white/40 rounded-xl backdrop-blur-sm">
                  <div className="text-2xl font-bold text-gray-900">
                    ${availablePricing?.promotionalPrice || 999}/year
                  </div>
                  <div className="text-sm text-gray-700 mt-1">Full access to all features</div>
                </div>

                {/* Benefits */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-gray-700">Unlimited evaluations</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-gray-700">Advanced AI analysis</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-gray-700">Priority support</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleSubscribe}
                className="w-full py-3 text-base font-semibold bg-gray-900 hover:bg-gray-800"
                size="lg"
              >
                {availablePricing?.plan === "First100" ? (
                  <>
                    Claim Your Spot <FaCrown className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Subscribe Now <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleDismiss}
                variant="ghost"
                className="w-full text-gray-600 hover:text-gray-800 hover:bg-white/20"
              >
                Maybe later
              </Button>
            </div>
          </div>
        </GradientContainer>
      </DialogContent>
    </Dialog>
  );
}