import { type RouterOutputs } from "@/trpc/shared";

export type ResearchDocument =
  RouterOutputs["researchDocuments"]["list"]["items"][number];
