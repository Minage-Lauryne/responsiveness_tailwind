"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { LoadingButton } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { AlertCircle, Check, CheckCircle, Clock, Sparkles, Tag } from "lucide-react";
import { toast } from "sonner";

interface PromotionalPricingProps {
  onSubscribe: (plan: "Standard" | "First100" | "FirstYear") => void;
  isLoading: boolean;
}

export function PromotionalPricing({ onSubscribe, isLoading }: PromotionalPricingProps) {
  const [discountCode, setDiscountCode] = useState("");
  const [applyCodeError, setApplyCodeError] = useState<string | null>(null);

  // Get available pricing without discount code first
  const { data: defaultPricing } = api.billing.getAvailablePricing.useQuery();

  const { data: firstYearAvailability } = api.billing.getFirstYearAvailability.useQuery();

  const { data: discountPricing, error: discountError, refetch: checkDiscount } = api.billing.getAvailablePricing.useQuery(
    { discountCode },
    { enabled: !!discountCode }
  );
  const isCodeApplied = !!discountCode && discountPricing?.plan === "FirstYear";

  const currentPricing = discountPricing || defaultPricing;

  const handleDiscountCodeCheck = async () => {
    setApplyCodeError(null); 
    
    if (!discountCode.trim()) {
      setApplyCodeError("Please enter a discount code.");
      return;
    }
    

    if (discountCode.trim().toUpperCase() !== "FIRSTYEAR") {
      setApplyCodeError("Invalid discount code. Please enter 'FIRSTYEAR' to access first year pricing.");
      return;
    }
    
    try {
      await checkDiscount();
    } catch (error) {
      toast.error(discountError?.message || 'Error checking discount code');
    }
  };

  const handleSubscribe = (plan: "Standard" | "First100" | "FirstYear") => {
    onSubscribe(plan);
  };

  if (!currentPricing) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Founding Member Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-orange-100 p-6">
          <div className="flex items-start gap-3 mb-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Sparkles className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-gray-900 mb-1">  {currentPricing.plan === "First100" && "Become a founding member"}
                {currentPricing.plan === "FirstYear" && "First Year Pricing"}
                {currentPricing.plan === "Standard" && "Standard Pricing"}</h3>
              {currentPricing.description && <p className="text-gray-700">{currentPricing.description}</p>}
            </div>
            {currentPricing.plan === "First100" && <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
              Limited Offer
            </Badge>}
          </div>
        </div>

        <div className="p-6 space-y-4">

          {currentPricing.plan === "Standard" && (
            <div className="flex items-start gap-3 p-4">

              <div>
                <p className="text-gray-900 mb-1">Basic Individual Plan ${currentPricing.promotionalPrice}/year</p>
              </div>
            </div>
          )}

          {currentPricing.plan === "FirstYear" && (
            <div className="flex items-start gap-3 p-4">

              <div>
                <p className="text-gray-900 mb-1">First Year Individual Plan ${currentPricing.promotionalPrice}/year</p>
              </div>
            </div>
          )}
          {/* Offer Details */}
          {currentPricing.plan === "First100" && (
            <>
              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-gray-900 mb-1">Limited Time: Only 100 Spots for $100/year</p>
                  <p className="text-sm text-gray-600">Lock in this exclusive rate for the first year</p>
                </div>
              </div>

              {/* Features */}

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Lifetime founding member pricing</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Priority support and early access to new features</span>
                </div>
              </div>

              {/* Warning Message */}
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800">
                  ⚠️ Once 100 spots are filled, this offer is no longer valid.
                </p>
              </div>
            </>
          )}



          {/* CTA Button */}
          <LoadingButton
            onClick={() => {
              handleSubscribe(currentPricing.plan);
            }}
            isLoading={isLoading}
            className="w-full"
            size="lg"
          >
            Subscribe Now
          </LoadingButton>


        </div>
      </div>

      {/* Discount Code Section - Only show if FirstYear is available or current plan is not FirstYear */}
      {/* firstYearAvailability?.isAvailable && */}
      {currentPricing.plan !== "FirstYear" && firstYearAvailability?.isAvailable &&(
        <Card>
          <CardHeader className="relative">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gradient-to-br from-[#84c4ef] to-[#b2f7c6] rounded-lg">
                  <Tag className="w-5 h-5 text-[#4ea9e6]" />
                </div>
                <div>
                  <CardTitle className="text-lg mb-1 flex items-center gap-2">
                    Have a Discount Code?
                    <Sparkles className="w-4 h-4 text-amber-500" />
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Enter <span className="px-2 py-0.5 bg-purple-100 text-purple-900 rounded font-mono text-xs">FIRSTYEAR</span> for special first-year pricing at $499/year
                  </CardDescription>
                </div>
              </div>

            </div>
          </CardHeader>
          <CardContent className="space-y-4 relative">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Label htmlFor="discount-code" className="sr-only">
                  Discount Code
                </Label>
                <div className={`relative transition-all `}>
                  <Input
                    id="discount-code"
                    placeholder="Enter your code here"
                    value={discountCode}
                    onChange={(e) => {
                      setDiscountCode(e.target.value.toUpperCase());
                      setApplyCodeError(null); // Clear apply code error when user types
                    }}
                    className="h-12 text-center font-mono tracking-wider uppercase pr-10 border-2 outline-none rounded-md"
                    disabled={isCodeApplied}
                  />
                  {isCodeApplied && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                  )}
                </div>
              </div>
              <LoadingButton
                onClick={handleDiscountCodeCheck}
                isLoading={isLoading}
                disabled={!discountCode.trim()}
                className={`h-12 px-8 transition-all rounded-md ${!discountCode.trim() ? "cursor-not-allowed opacity-50" : "bg-gradient-to-r from-[#84c4ef] to-[#b2f7c6]"}`}
 
              >
                Apply Code
              </LoadingButton >
            </div>
            {/* Apply Code Error Display */}
            {applyCodeError && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg animate-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-900">{applyCodeError}</p>
                  <p className="text-sm text-red-700 mt-1">Please check your code and try again.</p>
                </div>
              </div>
            )}
            {discountError && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg animate-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-900">{discountError.message}</p>
                  <p className="text-sm text-red-700 mt-1">Please check your code and try again.</p>
                </div>
              </div>
            )}

            {/* Success State */}
            {isCodeApplied && (
              <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-r-lg animate-in slide-in-from-top-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-green-900">Discount code applied successfully!</p>
                  <p className="text-sm text-green-700 mt-1">You're getting our exclusive first-year pricing of $499/year.</p>
                </div>

              </div>
            )}

            {/* Helper Text */}
            {!isCodeApplied && !discountError && (
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <div className="p-1 bg-white rounded">
                  ℹ️
                </div>
                <p>Discount codes are case-insensitive and will be applied to your subscription.</p>
              </div>
            )}

          </CardContent>
        </Card>
      )}

    </div>
  );
}