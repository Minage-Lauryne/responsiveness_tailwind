/*
  Warnings:

  - You are about to drop the `SavedResearchDocument` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "SavedResearchDocument" DROP CONSTRAINT "SavedResearchDocument_documentId_fkey";

-- DropForeignKey
ALTER TABLE "SavedResearchDocument" DROP CONSTRAINT "SavedResearchDocument_projectId_fkey";

-- DropForeignKey
ALTER TABLE "SavedResearchDocument" DROP CONSTRAINT "SavedResearchDocument_savedById_fkey";

-- DropTable
DROP TABLE "SavedResearchDocument";

-- CreateTable
CREATE TABLE "ProjectResearchDocument" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "savedById" TEXT NOT NULL,

    CONSTRAINT "ProjectResearchDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceDocument" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "supabaseURL" TEXT,
    "workspaceId" TEXT NOT NULL,
    "addedById" TEXT NOT NULL,

    CONSTRAINT "WorkspaceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectDocument" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "addedById" TEXT NOT NULL,

    CONSTRAINT "ProjectDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentLike" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "projectResearchDocumentId" TEXT NOT NULL,

    CONSTRAINT "DocumentLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentComment" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "content" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "projectResearchDocumentId" TEXT NOT NULL,

    CONSTRAINT "DocumentComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectResearchDocument_projectId_idx" ON "ProjectResearchDocument"("projectId");

-- CreateIndex
CREATE INDEX "ProjectResearchDocument_documentId_idx" ON "ProjectResearchDocument"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectResearchDocument_projectId_documentId_key" ON "ProjectResearchDocument"("projectId", "documentId");

-- CreateIndex
CREATE INDEX "WorkspaceDocument_workspaceId_idx" ON "WorkspaceDocument"("workspaceId");

-- CreateIndex
CREATE INDEX "ProjectDocument_projectId_idx" ON "ProjectDocument"("projectId");

-- CreateIndex
CREATE INDEX "ProjectDocument_documentId_idx" ON "ProjectDocument"("documentId");

-- CreateIndex
CREATE INDEX "ProjectDocument_addedById_idx" ON "ProjectDocument"("addedById");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectDocument_projectId_documentId_key" ON "ProjectDocument"("projectId", "documentId");

-- CreateIndex
CREATE INDEX "DocumentLike_projectResearchDocumentId_idx" ON "DocumentLike"("projectResearchDocumentId");

-- CreateIndex
CREATE INDEX "DocumentLike_projectId_idx" ON "DocumentLike"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentLike_userId_projectResearchDocumentId_key" ON "DocumentLike"("userId", "projectResearchDocumentId");

-- CreateIndex
CREATE INDEX "DocumentComment_projectResearchDocumentId_idx" ON "DocumentComment"("projectResearchDocumentId");

-- CreateIndex
CREATE INDEX "DocumentComment_projectId_idx" ON "DocumentComment"("projectId");

-- AddForeignKey
ALTER TABLE "ProjectResearchDocument" ADD CONSTRAINT "ProjectResearchDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectResearchDocument" ADD CONSTRAINT "ProjectResearchDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "ResearchDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectResearchDocument" ADD CONSTRAINT "ProjectResearchDocument_savedById_fkey" FOREIGN KEY ("savedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceDocument" ADD CONSTRAINT "WorkspaceDocument_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceDocument" ADD CONSTRAINT "WorkspaceDocument_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDocument" ADD CONSTRAINT "ProjectDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDocument" ADD CONSTRAINT "ProjectDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "WorkspaceDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDocument" ADD CONSTRAINT "ProjectDocument_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentLike" ADD CONSTRAINT "DocumentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentLike" ADD CONSTRAINT "DocumentLike_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentLike" ADD CONSTRAINT "DocumentLike_projectResearchDocumentId_fkey" FOREIGN KEY ("projectResearchDocumentId") REFERENCES "ProjectResearchDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentComment" ADD CONSTRAINT "DocumentComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentComment" ADD CONSTRAINT "DocumentComment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentComment" ADD CONSTRAINT "DocumentComment_projectResearchDocumentId_fkey" FOREIGN KEY ("projectResearchDocumentId") REFERENCES "ProjectResearchDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
