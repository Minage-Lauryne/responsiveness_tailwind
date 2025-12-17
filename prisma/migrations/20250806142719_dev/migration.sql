/*
  Warnings:

  - You are about to drop the column `rawTextEmbedding` on the `WorkspaceDocument` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "WorkspaceDocument" DROP COLUMN "rawTextEmbedding",
ADD COLUMN     "llmSummary" TEXT,
ADD COLUMN     "pageCount" INTEGER,
ADD COLUMN     "rawTextWordCount" INTEGER,
ALTER COLUMN "rawText" DROP NOT NULL;
