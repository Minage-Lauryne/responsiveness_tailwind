/*
  Warnings:

  - You are about to drop the column `isSaved` on the `Chat` table. All the data in the column will be lost.
  - You are about to drop the column `isSearch` on the `Chat` table. All the data in the column will be lost.
  - You are about to drop the column `visibility` on the `Chat` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ChatType" AS ENUM ('ANALYSIS', 'COUNTERPOINT', 'BIAS');

-- AlterTable
ALTER TABLE "Chat" DROP COLUMN "isSaved",
DROP COLUMN "isSearch",
DROP COLUMN "visibility",
ADD COLUMN     "type" "ChatType" NOT NULL DEFAULT 'ANALYSIS';
