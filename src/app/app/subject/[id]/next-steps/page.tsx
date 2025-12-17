import { NextStepsContainer } from "@/app/features/next-steps/container";
import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";
import { headers } from "next/headers";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  
  const ctx = await createTRPCContext({
    headers: await headers(),
  });
  
  const caller = appRouter.createCaller(ctx);
  const subject = await caller.subject.getWithDocuments(id);

  if (!subject) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Subject Not Found
          </h3>
          <p className="text-gray-500">
            This subject is not available in your current workspace context.
          </p>
        </div>
      </div>
    );
  }

  return <NextStepsContainer subject={subject} />;
}
