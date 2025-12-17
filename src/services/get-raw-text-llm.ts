import Anthropic from "@anthropic-ai/sdk";

/**
 * Extracts text from a scanned PDF using LLM-based processing.
 * This is used as a fallback when traditional text extraction fails.
 *
 * @param pdfBlob Blob object containing PDF data
 * @returns The extracted text from the scanned document
 * @throws Error if the LLM processing fails
 */
export async function getRawTextLLM(pdfBlob: Blob): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY environment variable is required");
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  try {
    // Convert Blob to base64
    const buffer = await pdfBlob.arrayBuffer();
    const base64Data = Buffer.from(buffer).toString("base64");

    const response = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64Data,
              },
            },
            {
              type: "text",
              text: "Please extract all the text content from this PDF document, preserving the original formatting and structure as much as possible. Include all headers, paragraphs, lists, and any other textual content.",
            },
          ],
        },
      ],
    });

    const textContent = response.content.find((block) => block.type === "text");

    if (!textContent?.text) {
      throw new Error("Unexpected response format from Anthropic API");
    }

    return textContent.text;
  } catch (error) {
    throw new Error(
      `LLM-based PDF text extraction failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
