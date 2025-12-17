/*
  Warnings:

  - You are about to drop the column `abstract_embedding` on the `ResearchDocument` table. All the data in the column will be lost.
  - Made the column `studyLink` on table `ResearchDocument` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ResearchDocument" DROP COLUMN "abstract_embedding",
ADD COLUMN     "abstractEmbedding" vector(1536),
ALTER COLUMN "studyLink" SET NOT NULL;
