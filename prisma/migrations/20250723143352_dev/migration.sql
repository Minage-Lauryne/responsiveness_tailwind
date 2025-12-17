/*
  Warnings:

  - You are about to drop the column `researchInquiryId` on the `Chat` table. All the data in the column will be lost.
  - You are about to drop the `ResearchInquiry` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ResearchInquiryToWorkspaceDocument` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Chat" DROP CONSTRAINT "Chat_researchInquiryId_fkey";

-- DropForeignKey
ALTER TABLE "ResearchInquiry" DROP CONSTRAINT "ResearchInquiry_activeChatId_fkey";

-- DropForeignKey
ALTER TABLE "ResearchInquiry" DROP CONSTRAINT "ResearchInquiry_createdById_fkey";

-- DropForeignKey
ALTER TABLE "ResearchInquiry" DROP CONSTRAINT "ResearchInquiry_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ResearchInquiry" DROP CONSTRAINT "ResearchInquiry_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "_ResearchInquiryToWorkspaceDocument" DROP CONSTRAINT "_ResearchInquiryToWorkspaceDocument_A_fkey";

-- DropForeignKey
ALTER TABLE "_ResearchInquiryToWorkspaceDocument" DROP CONSTRAINT "_ResearchInquiryToWorkspaceDocument_B_fkey";

-- AlterTable
ALTER TABLE "Chat" DROP COLUMN "researchInquiryId";

-- DropTable
DROP TABLE "ResearchInquiry";

-- DropTable
DROP TABLE "_ResearchInquiryToWorkspaceDocument";
