/*
  Warnings:

  - You are about to drop the column `response` on the `ProgramEvaluation` table. All the data in the column will be lost.
  - You are about to drop the `_MessageToProgramEvaluation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_MessageToProgramEvaluation" DROP CONSTRAINT "_MessageToProgramEvaluation_A_fkey";

-- DropForeignKey
ALTER TABLE "_MessageToProgramEvaluation" DROP CONSTRAINT "_MessageToProgramEvaluation_B_fkey";

-- AlterTable
ALTER TABLE "ProgramEvaluation" DROP COLUMN "response";

-- DropTable
DROP TABLE "_MessageToProgramEvaluation";

-- CreateTable
CREATE TABLE "_ChatToProgramEvaluation" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ChatToProgramEvaluation_AB_unique" ON "_ChatToProgramEvaluation"("A", "B");

-- CreateIndex
CREATE INDEX "_ChatToProgramEvaluation_B_index" ON "_ChatToProgramEvaluation"("B");

-- AddForeignKey
ALTER TABLE "_ChatToProgramEvaluation" ADD CONSTRAINT "_ChatToProgramEvaluation_A_fkey" FOREIGN KEY ("A") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChatToProgramEvaluation" ADD CONSTRAINT "_ChatToProgramEvaluation_B_fkey" FOREIGN KEY ("B") REFERENCES "ProgramEvaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
