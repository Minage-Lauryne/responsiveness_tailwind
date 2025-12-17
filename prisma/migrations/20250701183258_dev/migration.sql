-- CreateTable
CREATE TABLE "ResearchRequest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "context" TEXT,

    CONSTRAINT "ResearchRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ResearchRequestToWorkspaceDocument" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "ResearchRequest_createdById_idx" ON "ResearchRequest"("createdById");

-- CreateIndex
CREATE INDEX "ResearchRequest_workspaceId_idx" ON "ResearchRequest"("workspaceId");

-- CreateIndex
CREATE INDEX "ResearchRequest_subjectId_idx" ON "ResearchRequest"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "ResearchRequest_subjectId_key" ON "ResearchRequest"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "_ResearchRequestToWorkspaceDocument_AB_unique" ON "_ResearchRequestToWorkspaceDocument"("A", "B");

-- CreateIndex
CREATE INDEX "_ResearchRequestToWorkspaceDocument_B_index" ON "_ResearchRequestToWorkspaceDocument"("B");

-- AddForeignKey
ALTER TABLE "ResearchRequest" ADD CONSTRAINT "ResearchRequest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchRequest" ADD CONSTRAINT "ResearchRequest_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchRequest" ADD CONSTRAINT "ResearchRequest_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ResearchRequestToWorkspaceDocument" ADD CONSTRAINT "_ResearchRequestToWorkspaceDocument_A_fkey" FOREIGN KEY ("A") REFERENCES "ResearchRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ResearchRequestToWorkspaceDocument" ADD CONSTRAINT "_ResearchRequestToWorkspaceDocument_B_fkey" FOREIGN KEY ("B") REFERENCES "WorkspaceDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
