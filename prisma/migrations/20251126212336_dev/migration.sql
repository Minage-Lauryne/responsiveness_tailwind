-- CreateTable
CREATE TABLE "form_990_filings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "ein" VARCHAR(9) NOT NULL,
    "taxYear" INTEGER NOT NULL,
    "pdfUrl" TEXT NOT NULL,
    "totalRevenue" BIGINT,
    "totalExpenses" BIGINT,
    "totalAssets" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_990_filings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "form_990_filings_organizationId_idx" ON "form_990_filings"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "form_990_filings_ein_taxYear_key" ON "form_990_filings"("ein", "taxYear");

-- AddForeignKey
ALTER TABLE "form_990_filings" ADD CONSTRAINT "form_990_filings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
