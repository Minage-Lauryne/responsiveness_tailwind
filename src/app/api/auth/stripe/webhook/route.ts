import type { Stripe } from "stripe";
import { NextResponse } from "next/server";
import z from "zod";

import { constructWebhookEvent, getSubscriptionItem } from "@/lib/stripe";
import { env } from "@/create-env";
import db from "@/server/db";
import { fromUnixTime, isEqual } from "date-fns";


async function endActiveTrialIfNeeded(organizationId: string): Promise<void> {
  const organization = await db.organization.findUnique({
    where: { id: organizationId },
    select: { trialEndsAt: true },
  });

  if (organization?.trialEndsAt && organization.trialEndsAt > new Date()) {
    await db.organization.update({
      where: { id: organizationId },
      data: { trialEndsAt: new Date() },
    });
  }
}

async function allocateSeatsAutomatically(
  subscriptionId: string, 
  organizationId: string, 
  totalSeats: number
): Promise<void> {

  const members = await db.member.findMany({
    where: { organizationId },
    orderBy: [
      { role: "asc" }, 
      { createdAt: "asc" }, 
    ],
    take: totalSeats, // Only allocate up to the purchased seats
    select: {
      userId: true,
      role: true,
    },
  });


  type SeatAllocationRecord = { userId: string };
  type SeatAllocationCreateInput = {
    subscriptionId: string;
    userId: string;
    allocatedAt: Date;
  };
  type SeatAllocationClient = {
    findMany(args: { where: { subscriptionId: string }; select: { userId: true } }): Promise<SeatAllocationRecord[]>;
    createMany(args: { data: SeatAllocationCreateInput[]; skipDuplicates?: boolean }): Promise<{ count?: number }>;
  };

  const seatAllocation = (db as unknown as { seatAllocation: SeatAllocationClient }).seatAllocation;

  const existingAllocations = await seatAllocation.findMany({
    where: { subscriptionId },
    select: { userId: true },
  });

  const existingUserIds = new Set(existingAllocations.map(a => a.userId));

  const allocationsToCreate = members
    .filter(member => !existingUserIds.has(member.userId))
    .map(member => ({
      subscriptionId,
      userId: member.userId,
      allocatedAt: new Date(),
    }));

  if (allocationsToCreate.length > 0) {
    await seatAllocation.createMany({
      data: allocationsToCreate,
      skipDuplicates: true,
    });
  }
}

const subscriptionSchema = z
  .object({
    quantity: z
      .number({ invalid_type_error: "Subscription requires a quantity" })
      .gt(0, "Subscription quantity must not be 0"),
    current_period_start: z
      .number({
        invalid_type_error: "Subscription requires a current_period_start",
      })
      .gt(0, "current_period_start must not be 0"),
    current_period_end: z
      .number({
        invalid_type_error: "Subscription requires a current_period_end",
      })
      .gt(0, "current_period_end must not be 0"),
  })
  .transform((data) => ({
    ...data,
    current_period_end: fromUnixTime(data.current_period_end),
    current_period_start: fromUnixTime(data.current_period_start),
  }));

export async function POST(req: Request) {
  let event: Stripe.Event;
  
  console.log("🔔 Stripe webhook received");

  try {
    const rawBody = await (await req.blob()).text();
    const signature = req.headers.get("stripe-signature");
    
    console.log("🔍 Constructing webhook event...");
    event = await constructWebhookEvent(
      rawBody,
      signature as string,
      env.STRIPE_WEBHOOK_SIGNING_SECRET,
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    if (err! instanceof Error) {
      console.log(err);
    }
    console.log(`❌ Error message: ${errorMessage}`);
    return NextResponse.json(
      { message: `Webhook Error: ${errorMessage}` },
      { status: 400 },
    );
  }

  try {
    console.log(`🎯 Processing Stripe event: ${event.type}`);
    
    switch (event.type) {
      case "checkout.session.completed": {
        console.log("✅ Processing checkout.session.completed");
        const metadata = event.data.object.metadata;
        const subscriptionType = metadata?.subscriptionType || "Individual";
        const userId = metadata?.userId;
        const organizationId = metadata?.organizationId;
        
        if (subscriptionType === "Team" && !organizationId) {
          throw new Error(
            "Unable to map team subscription without organizationId in metadata.",
          );
        }
        
        if (subscriptionType === "Individual" && !userId) {
          throw new Error(
            "Unable to map individual subscription without userId in metadata.",
          );
        }

        const stripeSubscriptionId = event.data.object.subscription as string;
        const subscriptionItem = subscriptionSchema.parse(
          await getSubscriptionItem(stripeSubscriptionId),
        );

        const stripeCustomerId = event.data.object.customer as string;

        // Create subscription based on type
        const subscriptionData: any = {
          stripeSubscriptionId,
          status: "active",
          stripeCustomerId,
          periodStart: subscriptionItem.current_period_start,
          periodEnd: subscriptionItem.current_period_end,
          seats: subscriptionItem.quantity,
          type: subscriptionType,
        };

        if (subscriptionType === "Team") {
          subscriptionData.organizationId = organizationId;
        } else {
          subscriptionData.userId = userId;
        }

        // Stripe might send the same event twice, so this is using an
        // upsert in order to ensure a nice 20x response.
        const record = await db.subscription.upsert({
          where: { stripeSubscriptionId },
          create: subscriptionData,
          update: {
            status: "active",
            stripeCustomerId,
            periodStart: subscriptionItem.current_period_start,
            periodEnd: subscriptionItem.current_period_end,
            seats: subscriptionItem.quantity,
          },
        });


        if (subscriptionType === "Team" && organizationId) {
          await allocateSeatsAutomatically(record.id, organizationId, subscriptionItem.quantity);
          

          await endActiveTrialIfNeeded(organizationId);
        }

        const status = isEqual(record.createdAt, record.updatedAt) ? 201 : 200;
        console.log(`✅ Subscription ${record.id} processed successfully - Status: ${status}`);
        
        return NextResponse.json(
          { ok: true },
          { status },
        );
      }

      case "customer.subscription.updated": {
        console.log("🔄 Processing customer.subscription.updated");
        const subscriptionItem = subscriptionSchema.parse(
          await getSubscriptionItem(event.data.object.id),
        );

        const baseUpdate = {
          periodStart: subscriptionItem.current_period_start,
          periodEnd: subscriptionItem.current_period_end,
          seats: subscriptionItem.quantity,
        };

        switch (event.data.object.status) {
          case "incomplete":
          case "incomplete_expired":
          case "paused":
          case "trialing":
            // These cases are not covered by the application's
            // subscription logic and should theoretically
            // never be sent by Stripe.
            return NextResponse.json({ ok: false }, { status: 501 });
          case "past_due":
            await db.subscription.update({
              where: {
                stripeSubscriptionId: event.data.object.id,
              },
              data: {
                ...baseUpdate,
                pastDue: true,
              },
            });
            console.log("✅ Subscription updated to past_due");
            return NextResponse.json({ ok: true });
          case "unpaid":
          case "canceled":
            await db.subscription.update({
              where: {
                stripeSubscriptionId: event.data.object.id,
              },
              data: {
                ...baseUpdate,
                status: "retired",
                retirementReason: "unpaid",
              },
            });
            console.log("✅ Subscription retired (unpaid/canceled)");
            return NextResponse.json({ ok: true });
          case "active":
            await db.subscription.update({
              where: {
                stripeSubscriptionId: event.data.object.id,
              },
              data: {
                ...baseUpdate,
                pastDue: false,
                status: event.data.object.cancel_at_period_end
                  ? "canceled"
                  : "active",
              },
            });

            console.log("✅ Subscription updated to active");
            return NextResponse.json({ ok: true });
          default:
            console.error(`❌ Unexpected subscription status:`, event.data.object.status);
            return NextResponse.json({ ok: false, error: "Unexpected subscription status" }, { status: 500 });
        }
      }

      case "customer.subscription.deleted": {
        console.log("🗑️ Processing customer.subscription.deleted");
        const { retirementReason } = await db.subscription.findFirstOrThrow({
          where: {
            stripeSubscriptionId: event.data.object.id,
          },
          select: {
            retirementReason: true,
          },
        });
        await db.subscription.update({
          where: {
            stripeSubscriptionId: event.data.object.id,
          },
          data: {
            status: "retired",
            retirementReason: retirementReason || "canceledByUser",
          },
        });
        console.log("✅ Subscription deleted/retired successfully");
        return NextResponse.json({ ok: true });
      }

      default:
        console.log(
          `⚠️ Received unhandled event '${event.type}' from Stripe.`,
        );
        return NextResponse.json({ ok: true });
    }
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.error(
      `An error occured handling an event from Stripe: ${err.message}`,
    );
    console.error(err);
    console.error(event);
    
    // Return error response instead of throwing to ensure webhook responds
    return NextResponse.json(
      { 
        ok: false, 
        error: "Internal server error processing webhook",
        message: err.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}
