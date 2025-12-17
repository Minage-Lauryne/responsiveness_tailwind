-- CreateTable
CREATE TABLE "ProjectSearchQuery" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ProjectSearchQuery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectSearchQuery_userId_idx" ON "ProjectSearchQuery"("userId");

-- CreateIndex
CREATE INDEX "ProjectSearchQuery_projectId_idx" ON "ProjectSearchQuery"("projectId");

-- AddForeignKey
ALTER TABLE "ProjectSearchQuery" ADD CONSTRAINT "ProjectSearchQuery_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSearchQuery" ADD CONSTRAINT "ProjectSearchQuery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
