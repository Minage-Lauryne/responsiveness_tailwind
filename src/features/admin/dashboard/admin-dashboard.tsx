"use client";

import PageContainer from "@/features/dashboard-layout/page-container";
import { StatsCards } from "./stats-cards";

export function AdminDashboard() {
  return (
    <PageContainer
      breadcrumbs={[
        {
          href: "/app/admin",
          name: "Admin",
        },
      ]}
      className="space-y-8 p-8"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">System overview and statistics</p>
      </div>

      <StatsCards />
    </PageContainer>
  );
}
