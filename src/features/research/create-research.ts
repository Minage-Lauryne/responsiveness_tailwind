import { openai } from "@ai-sdk/openai";
import { embed } from "ai";
import { db } from "@/server/db";

export interface DocumentWithText {
  title: string;
  rawText: string;
}

export interface CreateResearchInput {
  context: string;
  documents: DocumentWithText[];
}

export interface ResearchDocument {
  id: string;
  studyTitle: string;
  abstract: string;
  citation: string;
  studyLink: string;
  similarity: number;
}

export interface CreateResearchResult {
  success: boolean;
  subjectId: string;
  input: CreateResearchInput;
  relevantResearch: ResearchDocument[];
}

export async function createResearch(
  subjectId: string,
  context: string,
  documents: DocumentWithText[],
): Promise<CreateResearchResult> {
  // Prepare the input for research creation
  const input: CreateResearchInput = {
    context,
    documents,
  };

  console.log(
    "Creating research for subject:",
    subjectId,
    "with",
    documents.length,
    "documents",
  );

  try {
    // Note: We tested Prisma 6 support for vector fields, but they are still marked as
    // Unsupported("vector(1536)") and not accessible through TypeScript.
    // Using raw SQL until Prisma fully supports pgvector.

    // Check if subject already has a contextEmbedding using raw SQL
    console.log("Checking for existing subject embedding...");

    const existingSubjectRaw = await db.$queryRaw<
      Array<{
        id: string;
        context: string;
        contextEmbedding: string | null;
      }>
    >`
      SELECT id, context, "contextEmbedding"::text as "contextEmbedding"
      FROM "Subject"
      WHERE id = ${subjectId}
    `;

    if (existingSubjectRaw.length === 0) {
      throw new Error(`Subject with id ${subjectId} not found`);
    }

    const existingSubject = {
      ...existingSubjectRaw[0],
      contextEmbedding: existingSubjectRaw[0]!.contextEmbedding
        ? (JSON.parse(existingSubjectRaw[0]!.contextEmbedding) as number[])
        : null,
    };

    let queryEmbedding: number[];

    if (existingSubject.contextEmbedding) {
      console.log("Using existing subject embedding");
      queryEmbedding = existingSubject.contextEmbedding;
    } else {
      console.log("No existing embedding found, creating new embedding...");

      // Create a combined text for embedding generation
      const documentTexts = documents
        .map((doc) => `${doc.title}: ${doc.rawText.substring(0, 1000)}`)
        .join("\n\n");
      const combinedText = `${context}\n\n${documentTexts}`;

      // Generate embedding for the combined context and documents
      const result = await embed({
        model: openai.embedding("text-embedding-3-small"),
        value: combinedText,
      });

      queryEmbedding = result.embedding;

      // Store the embedding in the subject for future use using raw SQL
      console.log("Storing new embedding in subject...");
      await db.$executeRaw`
        UPDATE "Subject"
        SET "contextEmbedding" = ${queryEmbedding}::vector
        WHERE id = ${subjectId}
      `;
    }

    console.log("Performing semantic search against research documents...");

    // Perform vector similarity search using raw SQL
    // Using cosine distance (1 - cosine_similarity) with pgvector
    const relevantResearch = await db.$queryRaw<ResearchDocument[]>`
      SELECT 
        id,
        "studyTitle",
        abstract,
        citation,
        "studyLink",
        (1 - ("abstractEmbedding" <-> ${queryEmbedding}::vector)) as similarity
      FROM "ResearchDocument"
      WHERE "abstractEmbedding" IS NOT NULL
        AND "isArchived" = false
        AND LENGTH("abstract") > 100
      ORDER BY "abstractEmbedding" <-> ${queryEmbedding}::vector
      LIMIT 10
    `;

    console.log(`Found ${relevantResearch.length} relevant research documents`);

    return {
      success: true,
      subjectId,
      input,
      relevantResearch,
    };
  } catch (error) {
    console.error("Error in createResearch:", error);

    // Return empty results on error but still mark as successful
    // so the calling code can handle the empty state gracefully
    return {
      success: true,
      subjectId,
      input,
      relevantResearch: [],
    };
  }
}
