/*
  Warnings:

  - You are about to drop the column `programEvaluationId` on the `Chat` table. All the data in the column will be lost.
  - You are about to drop the `ProgramEvaluation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ProgramEvaluationToWorkspaceDocument` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Chat" DROP CONSTRAINT "Chat_programEvaluationId_fkey";

-- DropForeignKey
ALTER TABLE "ProgramEvaluation" DROP CONSTRAINT "ProgramEvaluation_activeChatId_fkey";

-- DropForeignKey
ALTER TABLE "ProgramEvaluation" DROP CONSTRAINT "ProgramEvaluation_createdById_fkey";

-- DropForeignKey
ALTER TABLE "ProgramEvaluation" DROP CONSTRAINT "ProgramEvaluation_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ProgramEvaluation" DROP CONSTRAINT "ProgramEvaluation_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "_ProgramEvaluationToWorkspaceDocument" DROP CONSTRAINT "_ProgramEvaluationToWorkspaceDocument_A_fkey";

-- DropForeignKey
ALTER TABLE "_ProgramEvaluationToWorkspaceDocument" DROP CONSTRAINT "_ProgramEvaluationToWorkspaceDocument_B_fkey";

-- AlterTable
ALTER TABLE "Chat" DROP COLUMN "programEvaluationId",
ADD COLUMN     "SubjectId" TEXT;

-- DropTable
DROP TABLE "ProgramEvaluation";

-- DropTable
DROP TABLE "_ProgramEvaluationToWorkspaceDocument";

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "projectId" TEXT,
    "title" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "activeChatId" TEXT,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_SubjectToWorkspaceDocument" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "Subject_createdById_idx" ON "Subject"("createdById");

-- CreateIndex
CREATE INDEX "Subject_workspaceId_idx" ON "Subject"("workspaceId");

-- CreateIndex
CREATE INDEX "Subject_projectId_idx" ON "Subject"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "_SubjectToWorkspaceDocument_AB_unique" ON "_SubjectToWorkspaceDocument"("A", "B");

-- CreateIndex
CREATE INDEX "_SubjectToWorkspaceDocument_B_index" ON "_SubjectToWorkspaceDocument"("B");

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_SubjectId_fkey" FOREIGN KEY ("SubjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_activeChatId_fkey" FOREIGN KEY ("activeChatId") REFERENCES "Chat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SubjectToWorkspaceDocument" ADD CONSTRAINT "_SubjectToWorkspaceDocument_A_fkey" FOREIGN KEY ("A") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SubjectToWorkspaceDocument" ADD CONSTRAINT "_SubjectToWorkspaceDocument_B_fkey" FOREIGN KEY ("B") REFERENCES "WorkspaceDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
