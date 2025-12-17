"use client";

import { LoadingBlur } from "@/app/app/subject/components/loading-blur";
import PageContainer from "@/features/dashboard-layout/page-container";
import { api } from "@/trpc/react";
import { useState } from "react";
import { OrganizationDetailSheet } from "./organization-detail-sheet";
import OrganizationsTable from "./organizations-table";

export default function OrganizationsContainer() {
  const { data, isLoading, refetch } = api.organization.listAdmin.useQuery();

  // Separate state for the detail sheet
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  const handleCloseSheet = () => {
    setSelectedOrgId(null);
  };

  const handleOpenSheet = (organizationId: string) => {
    setSelectedOrgId(organizationId);
  };

  return (
    <PageContainer
      breadcrumbs={[
        {
          name: "Admin",
          href: "/app/admin",
        },
        {
          name: "Organizations",
        },
      ]}
    >
      <div className="flex flex-col space-y-8">
        <div>
          <LoadingBlur loading={isLoading} />
          {data && (
            <OrganizationsTable
              data={data}
              refetch={refetch}
              onOpenSheet={handleOpenSheet}
            />
          )}
        </div>
      </div>

      {/* Organization Detail Sheet */}
      {selectedOrgId && (
        <OrganizationDetailSheet
          organizationId={selectedOrgId}
          isOpen={!!selectedOrgId}
          onClose={handleCloseSheet}
        />
      )}
    </PageContainer>
  );
}
