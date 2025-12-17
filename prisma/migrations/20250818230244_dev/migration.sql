-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ChatType" ADD VALUE 'BOARD_MEMO';
ALTER TYPE "ChatType" ADD VALUE 'COMPREHENSIVE_REPORT';
ALTER TYPE "ChatType" ADD VALUE 'DISCUSSION_QUESTIONS';
ALTER TYPE "ChatType" ADD VALUE 'FINANCIAL_ANALYSIS';
ALTER TYPE "ChatType" ADD VALUE 'LANDSCAPE_ANALYSIS';
ALTER TYPE "ChatType" ADD VALUE 'LEADERSHIP_ANALYSIS';
ALTER TYPE "ChatType" ADD VALUE 'PROGRAM_ANALYSIS';
ALTER TYPE "ChatType" ADD VALUE 'RELEVANT_RESEARCH';
ALTER TYPE "ChatType" ADD VALUE 'SITE_VISIT_PREP_GUIDE';
ALTER TYPE "ChatType" ADD VALUE 'STRATEGIC_PLANNING_GUIDE';
