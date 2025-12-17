import { inferRouterOutputs } from "@trpc/server";
import { AppRouter } from "@/server/api/root";

type RouterOutput = inferRouterOutputs<AppRouter>;

export type OrganizationMembersOutput =
  RouterOutput["organization"]["listMembers"][number];
