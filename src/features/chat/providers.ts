import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { customProvider } from "ai";
import { createFallback } from "ai-fallback";

import { chatModel, titleModel } from "./providers-test";

// this is not in create-env because they don't seem to support optional env vars?
const useTestProviders =
  process.env.USE_TEST_PROVIDERS?.toLowerCase() === "true";
//
export const myProvider = useTestProviders
  ? customProvider({
      languageModels: {
        "chat-model": chatModel,
        "title-model": titleModel,
      },
    })
  : customProvider({
      languageModels: {
        "chat-model": createFallback({
          models: [
            anthropic("claude-4-sonnet-20250514"),
            google("gemini-2.5-pro"),
          ],
          shouldRetryThisError: (error) => {
            console.error(`Error with model`, error);
            return false;
          },
          modelResetInterval: 60000, // Reset to primary model after 1 minute
        }),
        "title-model": createFallback({
          models: [
            anthropic("claude-3-5-haiku-latest"),
            google("gemini-2.0-flash-lite"),
          ],
          onError: (error, modelId) => {
            console.error(`Error with model ${modelId}:`, error);
          },
          modelResetInterval: 60000,
        }),
      },
    });
