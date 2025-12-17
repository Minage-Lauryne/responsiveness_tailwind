/*
  Warnings:

  - You are about to drop the `_ChatToProgramEvaluation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_ChatToProgramEvaluation" DROP CONSTRAINT "_ChatToProgramEvaluation_A_fkey";

-- DropForeignKey
ALTER TABLE "_ChatToProgramEvaluation" DROP CONSTRAINT "_ChatToProgramEvaluation_B_fkey";

-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "programEvaluationId" TEXT;

-- AlterTable
ALTER TABLE "ProgramEvaluation" ADD COLUMN     "activeChatId" TEXT;

-- DropTable
DROP TABLE "_ChatToProgramEvaluation";

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_programEvaluationId_fkey" FOREIGN KEY ("programEvaluationId") REFERENCES "ProgramEvaluation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramEvaluation" ADD CONSTRAINT "ProgramEvaluation_activeChatId_fkey" FOREIGN KEY ("activeChatId") REFERENCES "Chat"("id") ON DELETE SET NULL ON UPDATE CASCADE;
