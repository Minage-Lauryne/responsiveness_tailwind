import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";

type RouterOutput = inferRouterOutputs<AppRouter>;
export type OrganizationsAdminView =
  RouterOutput["organization"]["listAdmin"][number];
