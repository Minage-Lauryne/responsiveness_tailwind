import { inferRouterOutputs } from "@trpc/server";
import { type AppRouter } from "@/server/api/root";

export type Me = inferRouterOutputs<AppRouter>["me"]["get"];
