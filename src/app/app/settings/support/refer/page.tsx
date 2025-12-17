import Link from "next/link";
import { CopyToClipboard } from "@/components/copy-to-clipboard";
import PageContainer from "@/features/dashboard-layout/page-container";

export default function Refer() {
  return (
    <PageContainer
      breadcrumbs={[
        {
          href: "/app",
          name: "Home",
        },
        {
          name: "Refer",
        },
      ]}
    >
      <div className="prose flex flex-col gap-y-4 p-8 text-black">
        {/* <div className="text-2xl font-bold">Refer</div> */}

        <h3 className="m-0">Refer another company to Complēre</h3>

        <p className="">
          For a limited time, referrals are a way to get a discount on your next
          Complēre membership.
        </p>
        <p>
          Referrals are currently handled by our support team. If you'd like to
          refer someone to use the Complēre platform, please reach out to us at{" "}
          <CopyToClipboard className="inline">
            <a href="mailto:support@complere.ai">support@complere.ai</a>{" "}
          </CopyToClipboard>
          with their email address.
        </p>

        <h3 className="m-0">Invite Colleague</h3>
        <p>
          If you're looking to instead invite a colleague to your same
          workspace, you can do so{" "}
          <Link className="underline" href="/app/settings/team">
            here
          </Link>
        </p>
      </div>
    </PageContainer>
  );
}
