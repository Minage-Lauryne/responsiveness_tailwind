import { Stripe } from "stripe";
import { type SubscriptionPlan } from "@prisma/client";

type StripePricingModel = {
  product: Stripe.ProductCreateParams;
  tieredBasePrice: Stripe.PriceCreateParams & ({ lookup_key: string } | { price_id: string });
};


export const STRIPE_LOOKUP_KEYS = {
  FIRST_100: "first_100_annual_promotion_v1", // $100 per year
  FIRST_YEAR: "first_year_discount_annual_v1", // $499 per year
} as const;

export const stripePricingData: Record<SubscriptionPlan, StripePricingModel> = {
  Standard: {
    product: {
      name: "Complere AI Subscription",
    },
    tieredBasePrice: {
      currency: "USD",
      lookup_key: "standard_tiered_base_price_v3",
      recurring: {
        interval: "year",
        usage_type: "licensed",
      },
      billing_scheme: "tiered",
      tiers_mode: "graduated",
      tiers: [
        { up_to: 5, flat_amount_decimal: "0", unit_amount_decimal: "75000" },
        { up_to: 10, flat_amount_decimal: "0", unit_amount_decimal: "67500" },
        {
          up_to: "inf",
          flat_amount_decimal: "0",
          unit_amount_decimal: "60750",
        },
      ],
    },
  },
  First100: {
    product: {
      name: "Complere AI Subscription - First 100",
    },
    tieredBasePrice: {
      currency: "USD",
      lookup_key: STRIPE_LOOKUP_KEYS.FIRST_100, 
      recurring: {
        interval: "year",
        usage_type: "licensed",
      },
      billing_scheme: "per_unit",
      unit_amount_decimal: "10000", // $100 per seat
    },
  },
  FirstYear: {
    product: {
      name: "Complere AI Subscription - First Year",
    },
    tieredBasePrice: {
      currency: "USD",
      lookup_key: STRIPE_LOOKUP_KEYS.FIRST_YEAR,
      recurring: {
        interval: "year",
        usage_type: "licensed",
      },
      billing_scheme: "per_unit",
      unit_amount_decimal: "49900", // $499 per seat
    },
  },
} as const;
