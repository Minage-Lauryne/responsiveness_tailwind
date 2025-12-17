import { z } from "zod";

export const csvDataSchema = z.object({
  rows: z.array(
    z.object({
      programElement: z.string().describe("Program Element name"),
      thinkSmallDescription: z.string().describe("Think Small Description"),
      researchAlignment: z.string().describe("Research Alignment"),
      strengthOfEvidence: z.string().describe("Strength of Evidence"),
      commentary: z.string().describe("Commentary"),
    }),
  ),
  analysisMarkdown: z
    .string()
    .describe(
      "Additional analysis content in markdown format including research basis, interpretation, and recommendations",
    ),
});
