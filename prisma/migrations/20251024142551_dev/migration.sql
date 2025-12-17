/*
  Warnings:

  - You are about to drop the column `expiredEmailSent` on the `Invitation` table. All the data in the column will be lost.
  - You are about to drop the column `reminderSentAt` on the `Invitation` table. All the data in the column will be lost.
  - You are about to drop the column `remindersSent` on the `Invitation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Invitation" DROP COLUMN "expiredEmailSent",
DROP COLUMN "reminderSentAt",
DROP COLUMN "remindersSent";
