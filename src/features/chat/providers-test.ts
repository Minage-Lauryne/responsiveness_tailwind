import {
  CoreMessage,
  LanguageModelV1StreamPart,
  simulateReadableStream,
} from "ai";
import { MockLanguageModelV1 } from "ai/test";
import { TEST_PROMPTS } from "./providers-prompts";

import { exampleSubjectEval } from "./example-subject-eval";
import { z } from "zod";

export const chatModel = new MockLanguageModelV1({
  doGenerate: async () => ({
    rawCall: { rawPrompt: null, rawSettings: {} },
    finishReason: "stop",
    usage: { promptTokens: 10, completionTokens: 20 },
    text: `Hello, world!`,
  }),
  doStream: async ({ prompt }) => ({
    stream: simulateReadableStream({
      chunkDelayInMs: 10,
      initialDelayInMs: 500,
      chunks: getResponseChunksByPrompt(prompt),
    }),
    rawCall: { rawPrompt: null, rawSettings: {} },
  }),
});

export const reasoningModel = new MockLanguageModelV1({
  doGenerate: async () => ({
    rawCall: { rawPrompt: null, rawSettings: {} },
    finishReason: "stop",
    usage: { promptTokens: 10, completionTokens: 20 },
    text: `Hello, world!`,
  }),
  doStream: async ({ prompt }) => ({
    stream: simulateReadableStream({
      chunkDelayInMs: 500,
      initialDelayInMs: 1000,
      chunks: getResponseChunksByPrompt(prompt, true),
    }),
    rawCall: { rawPrompt: null, rawSettings: {} },
  }),
});

export const titleModel = new MockLanguageModelV1({
  defaultObjectGenerationMode: "json",
  doGenerate: async () => ({
    rawCall: { rawPrompt: null, rawSettings: {} },
    finishReason: "stop",
    usage: { promptTokens: 10, completionTokens: 20 },
    text: `{"title": "Test Analysis Title"}`,
  }),
  doStream: async () => ({
    stream: simulateReadableStream({
      chunkDelayInMs: 500,
      initialDelayInMs: 1000,
      chunks: [
        { type: "text-delta", textDelta: '{"title": "Test Analysis Title"}' },
        {
          type: "finish",
          finishReason: "stop",
          logprobs: undefined,
          usage: { completionTokens: 10, promptTokens: 3 },
        },
      ],
    }),
    rawCall: { rawPrompt: null, rawSettings: {} },
  }),
});

export const artifactModel = new MockLanguageModelV1({
  doGenerate: async () => ({
    rawCall: { rawPrompt: null, rawSettings: {} },
    finishReason: "stop",
    usage: { promptTokens: 10, completionTokens: 20 },
    text: `Hello, world!`,
  }),
  doStream: async ({ prompt }) => ({
    stream: simulateReadableStream({
      chunkDelayInMs: 50,
      initialDelayInMs: 100,
      chunks: getResponseChunksByPrompt(prompt),
    }),
    rawCall: { rawPrompt: null, rawSettings: {} },
  }),
});

export function compareMessages(
  firstMessage: CoreMessage,
  secondMessage: CoreMessage,
): boolean {
  if (firstMessage.role !== secondMessage.role) return false;

  if (
    !Array.isArray(firstMessage.content) ||
    !Array.isArray(secondMessage.content)
  ) {
    return false;
  }

  if (firstMessage.content.length !== secondMessage.content.length) {
    return false;
  }

  for (let i = 0; i < firstMessage.content.length; i++) {
    const item1 = firstMessage.content[i]!;
    const item2 = secondMessage.content[i]!;

    if (item1.type !== item2.type) return false;

    if (item1.type === "image" && item2.type === "image") {
      // if (item1.image.toString() !== item2.image.toString()) return false;
      // if (item1.mimeType !== item2.mimeType) return false;
    } else if (item1.type === "text" && item2.type === "text") {
      if (item1.text !== item2.text) return false;
    } else if (item1.type === "tool-result" && item2.type === "tool-result") {
      if (item1.toolCallId !== item2.toolCallId) return false;
    } else {
      return false;
    }
  }

  return true;
}

const textToDeltas = (text: string): LanguageModelV1StreamPart[] => {
  const deltas = text
    .split(" ")
    .map((char) => ({ type: "text-delta" as const, textDelta: `${char} ` }));

  return deltas;
};

const reasoningToDeltas = (text: string): LanguageModelV1StreamPart[] => {
  const deltas = text
    .split(" ")
    .map((char) => ({ type: "reasoning" as const, textDelta: `${char} ` }));

  return deltas;
};

export const getResponseChunksByPrompt = (
  prompt: CoreMessage[],
  isReasoningEnabled = false,
): Array<LanguageModelV1StreamPart> => {
  const recentMessage = prompt.at(-1);

  if (!recentMessage) {
    throw new Error("No recent message found!");
  }

  if (isReasoningEnabled) {
    if (compareMessages(recentMessage, TEST_PROMPTS.USER_SKY!)) {
      return [
        ...reasoningToDeltas("The sky is blue because of rayleigh scattering!"),
        ...textToDeltas("It's just blue duh!"),
        {
          type: "finish",
          finishReason: "stop",
          logprobs: undefined,
          usage: { completionTokens: 10, promptTokens: 3 },
        },
      ];
    } else if (compareMessages(recentMessage, TEST_PROMPTS.USER_GRASS!)) {
      return [
        ...reasoningToDeltas(
          "Grass is green because of chlorophyll absorption!",
        ),
        ...textToDeltas("It's just green duh!"),
        {
          type: "finish",
          finishReason: "stop",
          logprobs: undefined,
          usage: { completionTokens: 10, promptTokens: 3 },
        },
      ];
    }
  }

  if (compareMessages(recentMessage, TEST_PROMPTS.USER_THANKS!)) {
    return [
      ...textToDeltas("You're welcome!"),
      {
        type: "finish",
        finishReason: "stop",
        logprobs: undefined,
        usage: { completionTokens: 10, promptTokens: 3 },
      },
    ];
  } else if (compareMessages(recentMessage, TEST_PROMPTS.USER_GRASS!)) {
    return [
      ...textToDeltas("It's just green duh!"),
      {
        type: "finish",
        finishReason: "stop",
        logprobs: undefined,
        usage: { completionTokens: 10, promptTokens: 3 },
      },
    ];
  } else if (compareMessages(recentMessage, TEST_PROMPTS.USER_SKY!)) {
    return [
      ...textToDeltas("It's just blue duh!"),
      {
        type: "finish",
        finishReason: "stop",
        logprobs: undefined,
        usage: { completionTokens: 10, promptTokens: 3 },
      },
    ];
  } else if (compareMessages(recentMessage, TEST_PROMPTS.USER_NEXTJS!)) {
    return [
      ...textToDeltas("With Next.js, you can ship fast!"),

      {
        type: "finish",
        finishReason: "stop",
        logprobs: undefined,
        usage: { completionTokens: 10, promptTokens: 3 },
      },
    ];
  } else if (
    compareMessages(recentMessage, TEST_PROMPTS.USER_IMAGE_ATTACHMENT!)
  ) {
    return [
      ...textToDeltas("This painting is by Monet!"),
      {
        type: "finish",
        finishReason: "stop",
        logprobs: undefined,
        usage: { completionTokens: 10, promptTokens: 3 },
      },
    ];
    // Removed createDocument tool test case since artifact tools are gone
  } else {
    return [
      ...textToDeltas(exampleSubjectEval),
      {
        type: "finish",
        finishReason: "stop",
        logprobs: undefined,
        usage: { completionTokens: 10, promptTokens: 3 },
      },
    ];
  }
};

// else if (
//   compareMessages(recentMessage, TEST_PROMPTS.CREATE_DOCUMENT_TEXT_RESULT!)
// ) {
//   return [
//     {
//       type: "text-delta",
//       textDelta: "A document was created and is now visible to the user.",
//     },
//     {
//       type: "finish",
//       finishReason: "tool-calls",
//       logprobs: undefined,
//       usage: { completionTokens: 10, promptTokens: 3 },
//     },
//   ];

// }

// return [{ type: "text-delta", textDelta: "Unknown test prompt!" }];
