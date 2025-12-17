/*
  Warnings:

  - A unique constraint covering the columns `[token]` on the table `Invitation` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,organizationId]` on the table `Member` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `token` to the `Invitation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN     "token" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "domain" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Member_userId_organizationId_key" ON "Member"("userId", "organizationId");
