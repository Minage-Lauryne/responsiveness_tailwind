import { api } from "@/trpc/react";

export function HeroTitle() {
  const { data } = api.me.get.useQuery();
  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-1 py-6 pb-3">
      <h1 className="text-[38px] font-semibold leading-[47px] tracking-normal text-espresso">
        Welcome {data?.firstName}
      </h1>
      <p className="text-[23px] font-normal leading-[23px] tracking-normal text-espresso">
        Get started on your research. You can quick start with an analysis pathway or create a full comprehensive analysis.
      </p>
    </div>
  );
}
