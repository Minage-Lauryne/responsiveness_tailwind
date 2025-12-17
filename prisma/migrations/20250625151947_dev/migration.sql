-- DropForeignKey
ALTER TABLE "Completion" DROP CONSTRAINT "Completion_subjectId_fkey";

-- AddForeignKey
ALTER TABLE "Completion" ADD CONSTRAINT "Completion_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
