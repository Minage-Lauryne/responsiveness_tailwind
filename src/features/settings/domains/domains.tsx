"use client";

import { api } from "@/trpc/react";
import OrganizationDomainsTable from "./domains-table";
import { LoadingCardSpinner } from "@/features/shared/loading-spinner";

export default function Domains() {
  const { data: me } = api.me.get.useQuery();
  const activeOrganization = me?.activeOrganization;

  const { data, isLoading } = api.organization.getDomains.useQuery(
    {
      organizationId: activeOrganization?.id,
    },
    {
      enabled: !!activeOrganization?.id,
    },
  );

  if (isLoading) {
    return <LoadingCardSpinner />;
  }

  if (!activeOrganization?.id) {
    return (
      <div className="text-muted-foreground">No active organization found</div>
    );
  }

  return <OrganizationDomainsTable domains={data?.domains ?? []} />;
}
