-- AlterTable
ALTER TABLE "Chat" ALTER COLUMN "organizationId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "organizationEmail" TEXT;

-- AlterTable
ALTER TABLE "ResearchRequest" ALTER COLUMN "organizationId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Subject" ALTER COLUMN "organizationId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "WorkspaceDocument" ALTER COLUMN "organizationId" DROP NOT NULL;
