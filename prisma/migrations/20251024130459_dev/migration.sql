/*
  Warnings:

  - You are about to drop the column `reminderSent` on the `Invitation` table. All the data in the column will be lost.
  - Added the required column `remindersSent` to the `Invitation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Invitation" DROP COLUMN "reminderSent",
ADD COLUMN     "reminderSentAt" TIMESTAMP(3),
ADD COLUMN     "remindersSent" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "expiredEmailSent" DROP DEFAULT;
