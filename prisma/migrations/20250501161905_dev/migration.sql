/*
  Warnings:

  - Made the column `isArchived` on table `ResearchDocument` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ResearchDocument" ALTER COLUMN "isArchived" SET NOT NULL;
