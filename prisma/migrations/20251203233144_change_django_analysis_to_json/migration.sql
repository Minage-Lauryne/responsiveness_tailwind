/*
  Warnings:

  - You are about to drop the column `django_analysis_id` on the `Subject` table. All the data in the column will be lost.

*/
-- Add new column
ALTER TABLE "Subject" ADD COLUMN "django_analysis_ids" JSONB;

-- Migrate existing data: convert djangoAnalysisId to JSON format {"ANALYSIS": "id"}
UPDATE "Subject"
SET "django_analysis_ids" = json_build_object('ANALYSIS', "django_analysis_id")
WHERE "django_analysis_id" IS NOT NULL;

-- DropIndex
DROP INDEX "public"."Subject_django_analysis_id_idx";

-- Drop old column
ALTER TABLE "Subject" DROP COLUMN "django_analysis_id";
