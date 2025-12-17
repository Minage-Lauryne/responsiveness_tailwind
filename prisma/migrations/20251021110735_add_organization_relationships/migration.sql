/*
  Warnings:

  - Added the required column `organizationId` to the `Chat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `ResearchRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Subject` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `WorkspaceDocument` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."ResearchRequest_createdById_idx";

-- DropIndex
DROP INDEX "public"."Subject_createdById_idx";

-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ResearchRequest" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "WorkspaceDocument" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Chat_organizationId_idx" ON "Chat"("organizationId");

-- CreateIndex
CREATE INDEX "Chat_userId_organizationId_idx" ON "Chat"("userId", "organizationId");

-- CreateIndex
CREATE INDEX "ResearchRequest_organizationId_idx" ON "ResearchRequest"("organizationId");

-- CreateIndex
CREATE INDEX "ResearchRequest_createdById_organizationId_idx" ON "ResearchRequest"("createdById", "organizationId");

-- CreateIndex
CREATE INDEX "Subject_organizationId_idx" ON "Subject"("organizationId");

-- CreateIndex
CREATE INDEX "Subject_createdById_organizationId_idx" ON "Subject"("createdById", "organizationId");

-- CreateIndex
CREATE INDEX "WorkspaceDocument_organizationId_idx" ON "WorkspaceDocument"("organizationId");

-- CreateIndex
CREATE INDEX "WorkspaceDocument_addedById_organizationId_idx" ON "WorkspaceDocument"("addedById", "organizationId");

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchRequest" ADD CONSTRAINT "ResearchRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceDocument" ADD CONSTRAINT "WorkspaceDocument_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
