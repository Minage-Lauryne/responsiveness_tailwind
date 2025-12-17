/*
  Warnings:

  - You are about to drop the column `activeChatId` on the `Subject` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Subject" DROP CONSTRAINT "Subject_activeChatId_fkey";

-- AlterTable
ALTER TABLE "Subject" DROP COLUMN "activeChatId";
