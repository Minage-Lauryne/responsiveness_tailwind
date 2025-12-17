import { env } from "@/create-env";
import { stripePricingData } from "@/stripe/data";
import { SubscriptionPlan } from "@prisma/client";
import { Stripe } from "stripe";

export const stripeClient = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
  appInfo: {
    name: "resipsa-ai",
    url: "https://resipsaai.com/",
  },
});

export async function getSubscriptionItem(
  subscriptionId: string
): Promise<Stripe.SubscriptionItem | null> {
  const { items: { data } } = await stripeClient.subscriptions.retrieve(subscriptionId);
  return data.length
    ? data[0] as Stripe.SubscriptionItem
    : null;
}

export async function constructWebhookEvent(
  payload: string,
  header: string,
  secret: string,
): Promise<Stripe.Event> {
  return stripeClient.webhooks.constructEvent(payload, header, secret);
}

export async function ensureCustomer(
  email: string,
): Promise<Stripe.Customer> {
  const customers = await stripeClient.customers.list({
    email,
    limit: 1,
  });
  if (customers.data.length) {
    return customers.data[0] as Stripe.Customer;
  }
  return stripeClient.customers.create({
    email
  });
}

type RedirectBehavior = { success: string, cancel: string };

export async function checkout(
  customer: Stripe.Customer,
  userOrOrgId: string,
  plan: SubscriptionPlan,
  minimumQuantity: number,
  redirects: RedirectBehavior,
  subscriptionType: "Individual" | "Team" = "Individual",
): Promise<Stripe.Checkout.Session> {
  const resolvedLineItems = await lineItemsForPlan(plan);
  const metadata: Record<string, string> = {
    customerId: customer.id,
    subscriptionType: subscriptionType,
  };
  
  // Set appropriate metadata based on subscription type
  if (subscriptionType === "Team") {
    metadata.organizationId = userOrOrgId;
  } else {
    metadata.userId = userOrOrgId;
  }
  
  return stripeClient.checkout.sessions.create({
    customer: customer.id,
    success_url: redirects.success,
    cancel_url: redirects.cancel,
    mode: "subscription",
    client_reference_id: userOrOrgId,
    subscription_data: {
      metadata,
    },
    metadata,
    line_items: resolvedLineItems.map(item => ({
      ...item,
      quantity: minimumQuantity,
      adjustable_quantity: {
        minimum: minimumQuantity,
        enabled: true,
      }
    })),
  } as Stripe.Checkout.SessionCreateParams);
}

export async function createAdhocBillingPortalConfiguration(
  subscriptionId: string,
  minimumQuantity: number,
): Promise<string> {
  const subscription = await stripeClient.subscriptions.retrieve(subscriptionId);
  const configuration = await stripeClient.billingPortal.configurations.create({
    features: {
      payment_method_update: {
        enabled: true,
      },
      subscription_update: {
        enabled: true,
        default_allowed_updates: ["quantity"],
        proration_behavior: "always_invoice",
        products: subscription.items.data.map(subscriptionItem => ({
          prices: [subscriptionItem.price.id],
          product: subscriptionItem.price.product as string,
          adjustable_quantity: {
            minimum: minimumQuantity,
            enabled: true,
          },
        })),
      },
      subscription_cancel: {
        enabled: true,
        mode: "at_period_end",
        proration_behavior: "none",
      },
    },
  });
  return configuration.id;
}

export async function disableBillingPortalConfiguration(
  configurationId: string,
): Promise<void> {
  await stripeClient.billingPortal.configurations.update(configurationId, {
    active: false,
  });
}

export async function openBillingPortal(
  customerId: string,
  subscriptionId: string,
  configurationId: string,
  redirectTo: RedirectBehavior,
): Promise<string> {
  const session = await stripeClient.billingPortal.sessions.create({
    customer: customerId,
    return_url: redirectTo.success,
    configuration: configurationId,
  });
  return session.url;
}

type AdHocPriceDefinition =
  | { lookupKey: string, quantity?: number }
  | { price: string, quantity?: number };

async function lineItemsForPlan(
  plan: SubscriptionPlan,
): Promise<Stripe.Checkout.SessionCreateParams.LineItem[]> {
  const pricingModel = stripePricingData[plan].tieredBasePrice;
  
  let data: AdHocPriceDefinition[];
  if ('price_id' in pricingModel) {
    // Use price ID for promotional plans
    data = [{
      price: pricingModel.price_id,
      quantity: 1,
    }];
  } else if ('lookup_key' in pricingModel) {
    // Use lookup key for standard tiered pricing
    data = [{
      lookupKey: pricingModel.lookup_key,
      quantity: 1,
    }];
  } else {
    throw new Error(`Invalid pricing model configuration for plan: ${plan}`);
  }

  return await Promise.all(data.map((i) => resolveLineItem(i)));
}

async function resolveLineItem(
  item: AdHocPriceDefinition,
): Promise<Stripe.Checkout.SessionCreateParams.LineItem> {
  if ("price" in item) {
    return { price: item.price, quantity: item.quantity };
  }

  const prices = await stripeClient.prices.list({
    lookup_keys: [item.lookupKey],
    active: true,
    limit: 1,
  });

  if (!prices.data.length) {
    throw new Error(
      `No price with lookupKey ${item.lookupKey} could be found.`
    );
  }

  return {
    price: (prices.data[0] as Stripe.Price).id,
    quantity: item.quantity
  };
}

export function allPages<T extends { id: string }>(
  pagerFn: (args: { limit: number, starting_after: string | undefined }) => Stripe.ApiListPromise<T>
): () => Promise<T[]> {
  return async function () {
    let startingAfter: string | undefined = undefined;
    let objects: T[] = [];
    while (true) {
      const response = await pagerFn({
        limit: 100,
        starting_after: startingAfter,
      });
      objects = [...objects, ...response.data];
      if (!response.has_more) {
        break;
      }
      const last = response.data[response.data.length - 1] as T;
      startingAfter = last.id;
    }
    return objects;
  }
}
