import { Prisma } from "@prisma/client";

export type SubjectWithDocuments = Prisma.SubjectGetPayload<{
  select: {
    id: true;
    createdAt: true;
    updatedAt: true;
    createdById: true;
    organizationId: true;
    isArchived: true;
    title: true;
    context: true;
    djangoAnalysisIds: true;
    documents: {
      select: {
        name: true;
        id: true;
      };
    };
  };
}>;
