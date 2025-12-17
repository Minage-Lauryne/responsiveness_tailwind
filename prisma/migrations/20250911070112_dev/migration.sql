-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('Standard');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'canceled', 'retired');

-- CreateEnum
CREATE TYPE "SubscriptionRetirementReason" AS ENUM ('unpaid', 'canceledByUser');

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "freeForever" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "trialEndsAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'Standard',
    "seats" INTEGER NOT NULL DEFAULT 1,
    "retirementReason" "SubscriptionRetirementReason",
    "pastDue" BOOLEAN NOT NULL DEFAULT false,
    "stripeCustomerId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

/*
* This is a custom addition to the Prisma generated code, enforcing a single
* active subscription for each organization.
*/
CREATE UNIQUE INDEX subscriptions_active_canceled_unique_idx ON "Subscription" ("organizationId") WHERE status IN ('active', 'canceled');

ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_check_period_dates" CHECK ("periodEnd" > "periodStart");
