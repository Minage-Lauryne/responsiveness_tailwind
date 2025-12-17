-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN     "expiredEmailSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reminderSent" BOOLEAN NOT NULL DEFAULT false;
