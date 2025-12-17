-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "django_analysis_id" TEXT;

-- CreateIndex
CREATE INDEX "Subject_django_analysis_id_idx" ON "Subject"("django_analysis_id");
