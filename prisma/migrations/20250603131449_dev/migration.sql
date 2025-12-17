-- CreateTable
CREATE TABLE "ProgramEvaluation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "context" TEXT NOT NULL,

    CONSTRAINT "ProgramEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_MessageToProgramEvaluation" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ProgramEvaluationToWorkspaceDocument" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "ProgramEvaluation_createdById_idx" ON "ProgramEvaluation"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "_MessageToProgramEvaluation_AB_unique" ON "_MessageToProgramEvaluation"("A", "B");

-- CreateIndex
CREATE INDEX "_MessageToProgramEvaluation_B_index" ON "_MessageToProgramEvaluation"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ProgramEvaluationToWorkspaceDocument_AB_unique" ON "_ProgramEvaluationToWorkspaceDocument"("A", "B");

-- CreateIndex
CREATE INDEX "_ProgramEvaluationToWorkspaceDocument_B_index" ON "_ProgramEvaluationToWorkspaceDocument"("B");

-- AddForeignKey
ALTER TABLE "ProgramEvaluation" ADD CONSTRAINT "ProgramEvaluation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MessageToProgramEvaluation" ADD CONSTRAINT "_MessageToProgramEvaluation_A_fkey" FOREIGN KEY ("A") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MessageToProgramEvaluation" ADD CONSTRAINT "_MessageToProgramEvaluation_B_fkey" FOREIGN KEY ("B") REFERENCES "ProgramEvaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProgramEvaluationToWorkspaceDocument" ADD CONSTRAINT "_ProgramEvaluationToWorkspaceDocument_A_fkey" FOREIGN KEY ("A") REFERENCES "ProgramEvaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProgramEvaluationToWorkspaceDocument" ADD CONSTRAINT "_ProgramEvaluationToWorkspaceDocument_B_fkey" FOREIGN KEY ("B") REFERENCES "WorkspaceDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
