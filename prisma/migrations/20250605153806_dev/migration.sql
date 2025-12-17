-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "researchInquiryId" TEXT;

-- AlterTable
ALTER TABLE "ProgramEvaluation" ADD COLUMN     "projectId" TEXT;

-- CreateTable
CREATE TABLE "ResearchInquiry" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "projectId" TEXT,
    "title" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "activeChatId" TEXT,

    CONSTRAINT "ResearchInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ResearchInquiryToWorkspaceDocument" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "ResearchInquiry_createdById_idx" ON "ResearchInquiry"("createdById");

-- CreateIndex
CREATE INDEX "ResearchInquiry_workspaceId_idx" ON "ResearchInquiry"("workspaceId");

-- CreateIndex
CREATE INDEX "ResearchInquiry_projectId_idx" ON "ResearchInquiry"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "_ResearchInquiryToWorkspaceDocument_AB_unique" ON "_ResearchInquiryToWorkspaceDocument"("A", "B");

-- CreateIndex
CREATE INDEX "_ResearchInquiryToWorkspaceDocument_B_index" ON "_ResearchInquiryToWorkspaceDocument"("B");

-- CreateIndex
CREATE INDEX "ProgramEvaluation_projectId_idx" ON "ProgramEvaluation"("projectId");

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_researchInquiryId_fkey" FOREIGN KEY ("researchInquiryId") REFERENCES "ResearchInquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramEvaluation" ADD CONSTRAINT "ProgramEvaluation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchInquiry" ADD CONSTRAINT "ResearchInquiry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchInquiry" ADD CONSTRAINT "ResearchInquiry_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchInquiry" ADD CONSTRAINT "ResearchInquiry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchInquiry" ADD CONSTRAINT "ResearchInquiry_activeChatId_fkey" FOREIGN KEY ("activeChatId") REFERENCES "Chat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ResearchInquiryToWorkspaceDocument" ADD CONSTRAINT "_ResearchInquiryToWorkspaceDocument_A_fkey" FOREIGN KEY ("A") REFERENCES "ResearchInquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ResearchInquiryToWorkspaceDocument" ADD CONSTRAINT "_ResearchInquiryToWorkspaceDocument_B_fkey" FOREIGN KEY ("B") REFERENCES "WorkspaceDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
