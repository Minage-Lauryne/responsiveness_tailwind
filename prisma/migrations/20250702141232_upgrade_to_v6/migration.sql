-- AlterTable
ALTER TABLE "_ProjectMembers" ADD CONSTRAINT "_ProjectMembers_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ProjectMembers_AB_unique";

-- AlterTable
ALTER TABLE "_ResearchInquiryToWorkspaceDocument" ADD CONSTRAINT "_ResearchInquiryToWorkspaceDocument_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ResearchInquiryToWorkspaceDocument_AB_unique";

-- AlterTable
ALTER TABLE "_ResearchRequestToWorkspaceDocument" ADD CONSTRAINT "_ResearchRequestToWorkspaceDocument_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ResearchRequestToWorkspaceDocument_AB_unique";

-- AlterTable
ALTER TABLE "_SubjectToWorkspaceDocument" ADD CONSTRAINT "_SubjectToWorkspaceDocument_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_SubjectToWorkspaceDocument_AB_unique";

-- AlterTable
ALTER TABLE "_UserToWorkspace" ADD CONSTRAINT "_UserToWorkspace_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_UserToWorkspace_AB_unique";
