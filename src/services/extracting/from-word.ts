import * as mammoth from "mammoth";

export async function extractTextFromWord(fileBlob: Blob): Promise<string> {
  // Convert Blob to Buffer for mammoth (Node.js environment)
  const arrayBuffer = await fileBlob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Extract raw text using mammoth
  const result = await mammoth.extractRawText({
    buffer: buffer,
  });

  // Log any warnings or errors
  if (result.messages.length > 0) {
    console.warn("Mammoth messages:", result.messages);
  }

  return result.value;
}
