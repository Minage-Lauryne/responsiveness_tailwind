-- CreateEnum
CREATE TYPE "CompletionType" AS ENUM ('ANALYSIS', 'COMPARE', 'RESEARCH');

-- CreateTable
CREATE TABLE "Completion" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "subjectId" TEXT NOT NULL,
    "parts" JSONB NOT NULL,
    "type" "CompletionType" NOT NULL,
    "createdById" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,

    CONSTRAINT "Completion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Completion_subjectId_idx" ON "Completion"("subjectId");

-- CreateIndex
CREATE INDEX "Completion_createdById_idx" ON "Completion"("createdById");

-- CreateIndex
CREATE INDEX "Completion_workspaceId_idx" ON "Completion"("workspaceId");

-- AddForeignKey
ALTER TABLE "Completion" ADD CONSTRAINT "Completion_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Completion" ADD CONSTRAINT "Completion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Completion" ADD CONSTRAINT "Completion_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
