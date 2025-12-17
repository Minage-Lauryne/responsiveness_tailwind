import { db } from "@/server/db";
import { getTextFromFile } from "@/services/extracting/extract-text";
import { getEmbeddings } from "@/services/get-embeddings";
import { getDocument } from "@/services/supabase";
import { logger, task } from "@trigger.dev/sdk/v3";

export const indexResearchDocument = task({
  id: "index-research-document",
  run: async (payload: { docId: string }) => {
    const { docId } = payload;

    const document = await db.researchDocument.findFirstOrThrow({
      where: { id: docId },
    });

    try {
      logger.info("Fetch doc", { docId });

      const file = await getDocument(document.fileUrl!);

      logger.info("Extracting text", { docId });
      const { rawText } = await getTextFromFile(
        file,
        document.fileType ?? "application/pdf",
      );
      logger.info("Getting embeddings", { docId });
      const chunks = await getEmbeddings(docId, rawText);

      logger.info("Creating chunks", { docId });
      await db.researchDocumentChunk.createMany({
        data: chunks.map((chunk) => ({
          documentId: docId,
          chunkId: chunk.chunk_id,
          content: chunk.content,
          section: chunk.section,
          embedding: chunk.embedding,
        })),
      });

      // Update word count
      await db.researchDocument.update({
        where: { id: docId },
        data: {
          wordCount: rawText.split(" ").length,
        },
      });

      logger.info("Indexing completed", { docId });
    } catch (err) {
      logger.error("Indexing failed", { docId, error: err });
      throw err;
    }

    return { success: true };
  },
});
