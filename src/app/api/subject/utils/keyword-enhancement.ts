import { Message } from "ai";
import { DATA_CITATION_PROMPT } from "./prompts/data-citation";
import { NARRATIVE_PROMPT } from "./prompts/narrative";

export const DATA_CITATION_KEYWORD = "Check & cite the data points";

export const NARRATIVE_KEYWORD = "Write an illustrative fact based narrative";

// Define keyword patterns and their corresponding enhanced prompts
const KEYWORD_ENHANCEMENTS: Record<string, string> = {
  [DATA_CITATION_KEYWORD]: DATA_CITATION_PROMPT,
  [NARRATIVE_KEYWORD]: NARRATIVE_PROMPT,
  // Add more keyword patterns here as needed
};

/**
 * Detects if a message matches any special keyword patterns
 * @param message The user message to check
 * @returns The keyword if found, null otherwise
 */
export function detectKeywordMessage(message: Message): string | null {
  // Get the text content from the message parts
  if (!message.parts) {
    return null;
  }

  const textContent = message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join(" ")
    .trim();

  // Check for exact matches
  if (KEYWORD_ENHANCEMENTS[textContent]) {
    return textContent;
  }

  return null;
}

/**
 * Enhances a keyword message with the corresponding prompt
 * @param keyword The detected keyword
 * @returns The enhanced prompt content
 */
export function getEnhancedPrompt(keyword: string): string {
  const enhancedPrompt = KEYWORD_ENHANCEMENTS[keyword];
  if (!enhancedPrompt) {
    throw new Error(`No enhanced prompt found for keyword: ${keyword}`);
  }
  return enhancedPrompt;
}

/**
 * Creates an enhanced message for AI processing while keeping the original for DB storage
 * @param originalMessage The original user message
 * @param keyword The detected keyword
 * @returns Enhanced message for AI processing
 */
export function createEnhancedMessage(
  originalMessage: Message,
  keyword: string,
): Message {
  const enhancedPrompt = getEnhancedPrompt(keyword);

  return {
    ...originalMessage,
    parts: [
      {
        type: "text",
        text: enhancedPrompt,
      },
    ],
  };
}

/**
 * Checks if message should be enhanced and returns both original and enhanced versions
 * @param message The user message
 * @returns Object with original message (for DB) and enhanced message (for AI) if applicable
 */
export function processMessageForKeywordEnhancement(message: Message): {
  originalMessage: Message;
  enhancedMessage: Message;
  wasEnhanced: boolean;
} {
  const keyword = detectKeywordMessage(message);

  if (keyword) {
    return {
      originalMessage: message, // Save this to DB (keeps original text)
      enhancedMessage: createEnhancedMessage(message, keyword), // Send this to AI
      wasEnhanced: true,
    };
  }

  return {
    originalMessage: message,
    enhancedMessage: message,
    wasEnhanced: false,
  };
}
