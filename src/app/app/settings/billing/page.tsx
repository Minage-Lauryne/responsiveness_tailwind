import PageContainer from "@/features/dashboard-layout/page-container";
import { BillingContainer } from "@/features/settings/billing/index";

export default function Billing() {
  return (
    <PageContainer
      breadcrumbs={[
        {
          href: "/app/settings",
          name: "Settings",
        },
        {
          name: "Billing",
        },
      ]}
    >
      <div className="flex flex-col gap-y-4 p-8">
        <BillingContainer />
      </div>
    </PageContainer>
  );
}
