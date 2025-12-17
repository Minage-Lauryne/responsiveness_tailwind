/*
  Warnings:

  - You are about to drop the `Completion` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Completion" DROP CONSTRAINT "Completion_createdById_fkey";

-- DropForeignKey
ALTER TABLE "Completion" DROP CONSTRAINT "Completion_subjectId_fkey";

-- DropTable
DROP TABLE "Completion";

-- DropEnum
DROP TYPE "CompletionType";
