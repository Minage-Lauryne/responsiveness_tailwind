import { inferRouterOutputs } from "@trpc/server";
import { type AppRouter } from "@/server/api/root";

export type SubjectWithChat = inferRouterOutputs<AppRouter>["subject"]["get"];
