"use client";

import PageContainer from "@/features/dashboard-layout/page-container";
import { ResearchDocumentsTable } from "./table";
import { Button } from "@/components/ui/button";

export function AdminDocumentsContainer() {
  return (
    <PageContainer
      breadcrumbs={[
        {
          name: "Admin",
          href: "/app/admin",
        },
        {
          name: "Documents",
        },
      ]}
    >
      <div className="flex flex-col space-y-8">
        <div>
          <h2 className="mb-4 text-2xl font-bold">Research Documents</h2>
          <ResearchDocumentsTable />
        </div>
      </div>
    </PageContainer>
  );
}
