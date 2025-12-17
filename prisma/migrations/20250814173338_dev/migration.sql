/*
  Warnings:

  - You are about to drop the column `workspaceId` on the `Completion` table. All the data in the column will be lost.
  - You are about to drop the column `workspaceId` on the `ResearchRequest` table. All the data in the column will be lost.
  - You are about to drop the column `projectId` on the `Subject` table. All the data in the column will be lost.
  - You are about to drop the column `workspaceId` on the `Subject` table. All the data in the column will be lost.
  - You are about to drop the column `workspaceId` on the `WorkspaceDocument` table. All the data in the column will be lost.
  - You are about to drop the `DocumentComment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DocumentLike` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Project` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProjectDocument` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProjectResearchDocument` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProjectSearchQuery` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ProjectMembers` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `createdAt` on table `Verification` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `Verification` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Completion" DROP CONSTRAINT "Completion_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentComment" DROP CONSTRAINT "DocumentComment_projectId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentComment" DROP CONSTRAINT "DocumentComment_projectResearchDocumentId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentComment" DROP CONSTRAINT "DocumentComment_userId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentLike" DROP CONSTRAINT "DocumentLike_projectId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentLike" DROP CONSTRAINT "DocumentLike_projectResearchDocumentId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentLike" DROP CONSTRAINT "DocumentLike_userId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_createdById_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectDocument" DROP CONSTRAINT "ProjectDocument_addedById_fkey";

-- DropForeignKey
ALTER TABLE "ProjectDocument" DROP CONSTRAINT "ProjectDocument_documentId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectDocument" DROP CONSTRAINT "ProjectDocument_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectResearchDocument" DROP CONSTRAINT "ProjectResearchDocument_documentId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectResearchDocument" DROP CONSTRAINT "ProjectResearchDocument_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectResearchDocument" DROP CONSTRAINT "ProjectResearchDocument_savedById_fkey";

-- DropForeignKey
ALTER TABLE "ProjectSearchQuery" DROP CONSTRAINT "ProjectSearchQuery_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectSearchQuery" DROP CONSTRAINT "ProjectSearchQuery_userId_fkey";

-- DropForeignKey
ALTER TABLE "ResearchRequest" DROP CONSTRAINT "ResearchRequest_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "Subject" DROP CONSTRAINT "Subject_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Subject" DROP CONSTRAINT "Subject_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "WorkspaceDocument" DROP CONSTRAINT "WorkspaceDocument_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "_ProjectMembers" DROP CONSTRAINT "_ProjectMembers_A_fkey";

-- DropForeignKey
ALTER TABLE "_ProjectMembers" DROP CONSTRAINT "_ProjectMembers_B_fkey";

-- DropIndex
DROP INDEX "Completion_workspaceId_idx";

-- DropIndex
DROP INDEX "ResearchRequest_workspaceId_idx";

-- DropIndex
DROP INDEX "Subject_projectId_idx";

-- DropIndex
DROP INDEX "Subject_workspaceId_idx";

-- DropIndex
DROP INDEX "WorkspaceDocument_workspaceId_idx";

-- AlterTable
ALTER TABLE "Account" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Chat" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Completion" DROP COLUMN "workspaceId",
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "role" SET DEFAULT 'MEMBER',
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "ResearchDocument" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "ResearchDocumentChunk" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "ResearchRequest" DROP COLUMN "workspaceId",
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Session" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Stream" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Subject" DROP COLUMN "projectId",
DROP COLUMN "workspaceId",
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "url" TEXT,
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Verification" ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "updatedAt" SET NOT NULL,
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Vote" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Workspace" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "WorkspaceDocument" DROP COLUMN "workspaceId",
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "DocumentComment";

-- DropTable
DROP TABLE "DocumentLike";

-- DropTable
DROP TABLE "Project";

-- DropTable
DROP TABLE "ProjectDocument";

-- DropTable
DROP TABLE "ProjectResearchDocument";

-- DropTable
DROP TABLE "ProjectSearchQuery";

-- DropTable
DROP TABLE "_ProjectMembers";

-- DropEnum
DROP TYPE "ProjectStatus";

-- CreateTable
CREATE TABLE "domain" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "domain_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "domain_domain_key" ON "domain"("domain");

-- AddForeignKey
ALTER TABLE "domain" ADD CONSTRAINT "domain_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
