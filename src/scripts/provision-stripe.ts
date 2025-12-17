#!/usr/bin/env -S npx tsx

import { Stripe } from "stripe";
import { stripeClient, allPages } from "@/lib/stripe";
import { stripePricingData } from "./../stripe/data";

(async () => {
  if (process.env.NEXT_RUNTIME) {
    throw new Error("This script should never be called from within the Next.js application.");
  }

  for (const plan of Object.values(stripePricingData)) {
      const { product: productConfig, tieredBasePrice } = plan;

      let requiresNewPrices = false;
      let product: Stripe.Product | undefined;
      {
        const products = await allPages<Stripe.Product>((p) => stripeClient.products.list(p))();
        product = products.find((p) => p.name === productConfig.name);
        if (!product) {
          product = await stripeClient.products.create(productConfig);
          console.log("No existing product found, created a new one.")
          requiresNewPrices = true;
        } else {
          console.log(`Found existing product with name '${productConfig.name}', skipping creation.`);
        }
      }
      console.log(product);

      let price: Stripe.Price | undefined;
      {
        const prices = await allPages<Stripe.Price>((p) => stripeClient.prices.list(p))();
        price = prices.find((p) => p.lookup_key === tieredBasePrice.lookup_key);
        if (price && requiresNewPrices) {
          throw new Error(`Found a price that matches the configured lookup key, but need to create a new one. Update the lookup key, so a new price can be created.`)
        }
        if (!price || requiresNewPrices) {
          const creationParams = {
            ...tieredBasePrice,
            product: product.id,
          };
          price = await stripeClient.prices.create(creationParams);
        } else {
          console.log(`Found existing overage price with lookup key '${tieredBasePrice.lookup_key}', skipping creation.`);
        }
      }
      console.log(price);
  }
})()
  .then(() => {
    console.log("Script finished.")
  })
  .catch((err) => {
    console.error("The script encountered an error:");
    console.error(err);
    process.exitCode = 1;
  });
