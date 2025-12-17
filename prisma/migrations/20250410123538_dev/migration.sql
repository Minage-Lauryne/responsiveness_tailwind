/*
  Warnings:

  - Added the required column `projectStateHash` to the `ProjectSearchQuery` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProjectSearchQuery" ADD COLUMN     "projectStateHash" TEXT NOT NULL;
