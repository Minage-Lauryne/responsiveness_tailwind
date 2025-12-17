-- DropForeignKey
ALTER TABLE "ResearchRequest" DROP CONSTRAINT "ResearchRequest_subjectId_fkey";

-- AlterTable
ALTER TABLE "ResearchRequest" ALTER COLUMN "subjectId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ResearchRequest" ADD CONSTRAINT "ResearchRequest_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
