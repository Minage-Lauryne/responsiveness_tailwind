-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "originalCreatedById" TEXT;

-- CreateIndex
CREATE INDEX "Subject_originalCreatedById_idx" ON "Subject"("originalCreatedById");

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_originalCreatedById_fkey" FOREIGN KEY ("originalCreatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
