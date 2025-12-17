import { inferRouterOutputs } from "@trpc/server";
import { AppRouter } from "@/server/api/root";

type RouterOutput = inferRouterOutputs<AppRouter>;
export type ViewUser = RouterOutput["user"]["list"][number];
export type UserDetail = RouterOutput["user"]["get"];

export type OrganizationOutput =
  RouterOutput["organization"]["listAdmin"][number];
