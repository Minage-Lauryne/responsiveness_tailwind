-- AlterTable
ALTER TABLE "restoration_requests" ADD COLUMN     "appealMessage" TEXT,
ADD COLUMN     "appealedAt" TIMESTAMP(3),
ADD COLUMN     "rejectionReason" TEXT;
