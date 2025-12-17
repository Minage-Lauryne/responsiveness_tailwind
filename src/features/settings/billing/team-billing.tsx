import { useState } from "react";
import { Button, LoadingButton } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Users, UserCheck, Clock } from "lucide-react";

interface TeamBillingProps {
  organizationId: string;
  currentMembers: number;
}

export function TeamBilling({ organizationId, currentMembers }: TeamBillingProps) {
  const [seatCount, setSeatCount] = useState(Math.max(currentMembers, 5)); // Minimum 5 seats
  const router = useRouter();

  const { data: availablePricing, isLoading: pricingLoading } = 
    api.billing.getAvailablePricing.useQuery();

  const subscribeTeamMutation = api.billing.subscribe.useMutation({
    onError(err) {
      toast.error(`An error occurred subscribing: ${err.message}`);
    },
    onSuccess(url) {
      router.push(url);
    },
  });

  const handleTeamSubscribe = () => {
    if (!availablePricing) return;

    const successHref = new window.URL(window.location.href);
    successHref.pathname = "/app/success";

    subscribeTeamMutation.mutate({
      plan: availablePricing.plan,
      type: "Team",
      seats: seatCount,
      redirects: {
        success: successHref.toString(),
        cancel: window.location.href,
      },
    });
  };

  const calculatePrice = () => {
    if (!availablePricing) return 0;
    
    if (availablePricing.isPromotional && availablePricing.promotionalPrice) {
      return availablePricing.promotionalPrice * seatCount;
    }
    
    // Standard pricing with volume discounts
    const basePrice = 999;
    let pricePerSeat = basePrice;
    
    if (seatCount >= 10) {
      pricePerSeat = basePrice * 0.8; // 20% off for 10+ seats
    } else if (seatCount >= 5) {
      pricePerSeat = basePrice * 0.9; // 10% off for 5-9 seats
    }
    
    return pricePerSeat * seatCount;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (pricingLoading || !availablePricing) {
    return <div className="animate-pulse bg-gray-200 h-64 rounded-lg" />;
  }

  return (
    <Card className="w-full  ">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Subscription
        </CardTitle>
        <CardDescription>
          Purchase seats for your team members. All current members will be automatically allocated seats.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seat Selection */}
        <div className="space-y-2">
          <Label htmlFor="seatCount">Number of Seats</Label>
          <div className="flex items-center gap-4">
            <Input
              id="seatCount"
              type="number"
              min={Math.max(currentMembers, 5)}
              max={100}
              value={seatCount}
              onChange={(e) => setSeatCount(parseInt(e.target.value) || 5)}
              className="w-32 py-0 rounded-md h-10"
            />
            <div className="text-sm text-gray-600">
              Current team members: {currentMembers}
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Minimum 5 seats required. All current team members will get access automatically.
          </p>
        </div>

        {/* Pricing Display */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
          {availablePricing.isPromotional ? (
            <div>
              <Badge variant="secondary" className="mb-2">
                {availablePricing.description}
              </Badge>
              <div className="flex items-center justify-between">
                <span>Total Price (First Year)</span>
                <div className="text-right">
                  <div className="text-lg font-semibold text-green-600">
                    {formatPrice(calculatePrice())}
                  </div>
                  <div className="text-sm text-gray-500 line-through">
                    {formatPrice((availablePricing.originalPrice || 999) * seatCount)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span>Total Annual Price</span>
              <div className="text-lg font-semibold">
                {formatPrice(calculatePrice())}
              </div>
            </div>
          )}
          
          {/* Volume Discount Info */}
          {!availablePricing.isPromotional && (
            <div className="text-sm text-gray-600 border-t pt-2">
              <div>Per seat: {formatPrice(calculatePrice() / seatCount)}</div>
              {seatCount >= 10 && (
                <div className="text-green-600">✓ 20% volume discount applied</div>
              )}
              {seatCount >= 5 && seatCount < 10 && (
                <div className="text-green-600">✓ 10% volume discount applied</div>
              )}
            </div>
          )}
        </div>

        {/* Seat Allocation Info */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 flex items-center gap-2 mb-2">
            <UserCheck className="h-4 w-4" />
            Automatic Seat Allocation
          </h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>✓ Current team members get immediate access</p>
            <p>✓ New invitations will consume available seats</p>
            <p>✓ Admins can manage seat allocations in team settings</p>
          </div>
        </div>

        {/* Subscribe Button */}
        <LoadingButton
          onClick={handleTeamSubscribe}
          isLoading={subscribeTeamMutation.isLoading}
          className="w-full text-lg py-6"
          size="lg"
        >
          Subscribe Team ({seatCount} seats)
        </LoadingButton>

        <p className="text-xs text-gray-500 text-center">
          You can adjust the number of seats anytime through your billing portal.
          Billing occurs annually with automatic renewal.
        </p>
      </CardContent>
    </Card>
  );
}