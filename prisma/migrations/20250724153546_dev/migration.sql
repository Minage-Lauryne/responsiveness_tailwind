/*
  Warnings:

  - Made the column `supabaseURL` on table `WorkspaceDocument` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "WorkspaceDocument" ALTER COLUMN "supabaseURL" SET NOT NULL;
