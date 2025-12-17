import { OpenAI } from "openai";

const openai = new OpenAI();

export async function getEmbeddings(id: string, text: string) {
  const textChunks = chunkText(text, 500);

  // Get embeddings for all chunks
  const embeddingRes = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: textChunks,
  });

  // Prepare the chunked documents
  const chunks = textChunks.map((content, i) => ({
    chunk_id: `${id}-chunk-${i}`,
    content,
    section: `section-${i}`, // If you have actual section information, use it here
    embedding: embeddingRes.data[i]?.embedding ?? [],
  }));

  return chunks;
}

// lol we'll work on this.
function chunkText(text: string, maxTokens = 500): string[] {
  const sentences = text.split(/(?<=[.?!])\s+/);
  const chunks: string[] = [];
  let currentChunk = "";
  let currentTokens = 0;

  for (const sentence of sentences) {
    const tokenEstimate = Math.ceil(sentence.length / 4);
    if (currentTokens + tokenEstimate > maxTokens) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
      currentTokens = tokenEstimate;
    } else {
      currentChunk += " " + sentence;
      currentTokens += tokenEstimate;
    }
  }

  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
}
