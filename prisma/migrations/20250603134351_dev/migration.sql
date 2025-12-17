/*
  Warnings:

  - Added the required column `workspaceId` to the `ProgramEvaluation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProgramEvaluation" ADD COLUMN     "workspaceId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "ProgramEvaluation_workspaceId_idx" ON "ProgramEvaluation"("workspaceId");

-- AddForeignKey
ALTER TABLE "ProgramEvaluation" ADD CONSTRAINT "ProgramEvaluation_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
