-- CreateTable
CREATE TABLE "SavedResearchDocument" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "savedById" TEXT NOT NULL,

    CONSTRAINT "SavedResearchDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedResearchDocument_projectId_idx" ON "SavedResearchDocument"("projectId");

-- CreateIndex
CREATE INDEX "SavedResearchDocument_documentId_idx" ON "SavedResearchDocument"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedResearchDocument_projectId_documentId_key" ON "SavedResearchDocument"("projectId", "documentId");

-- AddForeignKey
ALTER TABLE "SavedResearchDocument" ADD CONSTRAINT "SavedResearchDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedResearchDocument" ADD CONSTRAINT "SavedResearchDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "ResearchDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedResearchDocument" ADD CONSTRAINT "SavedResearchDocument_savedById_fkey" FOREIGN KEY ("savedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
