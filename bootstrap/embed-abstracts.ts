import { openai } from "@ai-sdk/openai";
import { embed } from "ai";

import { db } from "@/server/db";

async function main() {
  try {
    console.log("Starting embedding process...");

    const researchDocuments = await db.researchDocument.findMany({
      take: Number.MAX_SAFE_INTEGER,
      where: {
        // TODO: will updating prisma end this maddness?
        // abstractEmbedding: null,
        abstract: {
          not: "NO ABSTRACT",
        },
      },
    });

    console.log(
      `Found ${researchDocuments.length} research documents to process`,
    );
    throw new Error("Stop here");

    for (const [index, researchDocument] of researchDocuments.entries()) {
      console.log(
        `Processing document ${index + 1}/${researchDocuments.length}: ${researchDocument.id}`,
      );

      let embedding;
      let retryCount = 0;
      const maxRetries = 1;

      while (retryCount <= maxRetries) {
        try {
          const result = await embed({
            model: openai.embedding("text-embedding-3-small"),
            value: researchDocument.abstract,
          });
          embedding = result.embedding;
          break;
        } catch (error) {
          retryCount++;
          if (retryCount > maxRetries) {
            console.error(
              `Failed to embed document ${researchDocument.id} after ${maxRetries + 1} attempts:`,
              error,
            );
            continue; // Skip this document and continue with the next
          }
          console.log(
            `Embedding failed for document ${researchDocument.id}, retrying (${retryCount}/${maxRetries})...`,
          );
          // Wait a bit before retrying
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      if (embedding) {
        try {
          // Note: prisma migrate dev does not support pgvector indexes???
          // https://github.com/pgvector/pgvector-node#prisma
          await db.$executeRaw`
            UPDATE "ResearchDocument" 
            SET "abstractEmbedding" = ${embedding}::vector 
            WHERE id = ${researchDocument.id}
          `;
          console.log(
            `Successfully updated embedding for document ${researchDocument.id}`,
          );
        } catch (error) {
          console.error(
            `Failed to update database for document ${researchDocument.id}:`,
            error,
          );
        }
      }
    }

    console.log("\nEmbedding process completed successfully!");
  } catch (error) {
    console.error("Error in embedding process:", error);
    process.exit(1);
  }
}

void main();
