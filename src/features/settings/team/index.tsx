"use client";

import { api } from "@/trpc/react";
import OrganizationMembersTable from "./table";
import { LoadingCardSpinner } from "@/features/shared/loading-spinner";

export default function Team() {
  const { data: me } = api.me.get.useQuery();
  const activeOrganization = me?.activeOrganization;

  const { data: members, isLoading } = api.organization.listMembers.useQuery(
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

  return <OrganizationMembersTable data={members ?? []} />;
}
