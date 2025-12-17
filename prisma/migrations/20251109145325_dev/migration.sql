-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('NOT_CHECKED', 'VERIFIED', 'INACTIVE', 'NOT_FOUND', 'SKIPPED', 'PENDING_ADMIN');

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "irsEin" TEXT,
ADD COLUMN     "irsExemptionStatus" TEXT,
ADD COLUMN     "irsOrganizationName" TEXT,
ADD COLUMN     "irsSubsectionCode" TEXT,
ADD COLUMN     "irsTaxPeriod" TEXT,
ADD COLUMN     "irsVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "irsVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "isUSBased" BOOLEAN,
ADD COLUMN     "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'NOT_CHECKED';

-- CreateTable
CREATE TABLE "irs_organization_data" (
    "ein" VARCHAR(9) NOT NULL,
    "organization_name" TEXT NOT NULL,
    "tax_period" VARCHAR(6),
    "asset_amount" BIGINT,
    "income_amount" BIGINT,
    "revenue_amount" BIGINT,
    "ruling_date" VARCHAR(6),
    "subsection" VARCHAR(2),
    "exemption_status" VARCHAR(2),

    CONSTRAINT "irs_organization_data_pkey" PRIMARY KEY ("ein")
);

-- CreateIndex
CREATE INDEX "irs_organization_data_organization_name_idx" ON "irs_organization_data"("organization_name");
