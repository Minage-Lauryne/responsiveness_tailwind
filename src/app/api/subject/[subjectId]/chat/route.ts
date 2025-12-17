import { generateUUID, getTrailingMessageId } from "@/features/chat/utils";
import {
appendClientMessage,
appendResponseMessages,
createDataStream,
Message,
smoothStream,
streamText,
} from "ai";

import {
postRequestBodySchema,
type PostRequestBody,
} from "@/app/api/subject/utils/schema";
import { myProvider } from "@/features/chat/providers";
import { NextResponse } from "next/server";
import { headers as getHeaders } from "next/headers";

import { getPromptByChatType } from "@/app/api/subject/utils/prompts/prompts";
import { getStreamContext } from "@/app/api/subject/utils/stream";
import { ChatSDKError } from "@/lib/errors";
import { auth } from "@/lib/auth";
import db from "@/server/db";
import { createId } from "@paralleldrive/cuid2";
import { dbToAIMessage } from "../../utils/db-to-ai-message";
import { prepareDocumentMessages } from "../../utils/prepare-messages";
import { processMessageForKeywordEnhancement } from "../../utils/keyword-enhancement";
import { checkTrialChatLimit } from "@/lib/utils/chat-limit";
import { getWorkspaceContext } from "@/lib/workspace";

export async function POST(
request: Request,
{ params }: { params: Promise<{ subjectId: string }> },
) {
const { subjectId } = await params;
const startTime = performance.now();
let requestBody: PostRequestBody;

try {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const json = await request.json();
  requestBody = postRequestBodySchema.parse(json);
} catch (_) {
  return new ChatSDKError("bad_request:api").toResponse();
}

try {
  const { id, message, selectedChatModel } = requestBody;

  const session = await auth.api.getSession({
    headers: await getHeaders(),
  });

  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  const organizationId = session.session.activeOrganizationId;
  const workspaceContext = getWorkspaceContext(session.user.id, organizationId);

  const subjectWhereClause = workspaceContext.type === "personal"
    ? { id: subjectId, organizationId: null, createdById: session.user.id }
    : { id: subjectId, organizationId: workspaceContext.organizationId };

  const subject = await db.subject.findFirst({
    where: subjectWhereClause,
  });

  if (!subject) {
    return NextResponse.json(
      { error: "Subject not found or access denied" },
      { status: 404 },
    );
  }

  const chat = await db.chat.findUnique({ 
    where: { id },
    include: { organization: true }
  });

  if (!chat && workspaceContext.type === "organization") {
    const isWithinLimit = await checkTrialChatLimit(organizationId!);

    if (!isWithinLimit) {
      return NextResponse.json(
        {
          error: "TRIAL_CHAT_LIMIT_EXCEEDED",
          message:
            "Your organization has reached the maximum number of chats for your trial. Please subscribe to continue.",
        },
        { status: 402 }, // Payment Required
      );
    }
  }

  if (!chat) {
    await db.chat.create({
      data: {
        id,
        userId: session.user.id,
        organizationId: organizationId || undefined,
        type: selectedChatModel,
        SubjectId: subjectId,
      },
    });
  } else {
    if (workspaceContext.type === "personal") {
      if (chat.organizationId !== null || chat.userId !== session.user.id) {
        return new ChatSDKError("forbidden:chat").toResponse();
      }
    } else {
      if (chat.organizationId !== organizationId) {
        return new ChatSDKError("forbidden:chat").toResponse();
      }
      if (chat.userId !== session.user.id) {
        return new ChatSDKError("forbidden:chat").toResponse();
      }
    }
  }

  const previousMessages = await db.message.findMany({
    where: { chatId: id },
    orderBy: { createdAt: "asc" },
  });

  const streamId = createId();
  await db.stream.create({
    data: { id: streamId, chatId: id, createdAt: new Date() },
  });

  const endTime = performance.now();
  console.log(
    `Time to stream took: ${((endTime - startTime) / 1000).toFixed(2)} seconds`,
  );

  const startTime2 = performance.now();

  // Process message for keyword enhancement
  const { originalMessage, enhancedMessage, wasEnhanced } =
    processMessageForKeywordEnhancement(message);

  if (wasEnhanced) {
    console.log("📝 Enhanced user message with keyword prompt");
  }

  // Use enhanced message for AI processing, but save original to DB
  const messages = appendClientMessage({
    messages: previousMessages.map(dbToAIMessage),
    message: enhancedMessage, // AI gets the enhanced version
  });

  const systemPrompt = getPromptByChatType(
    selectedChatModel,
    messages.length === 1,
  );
  const model = myProvider.languageModel("chat-model");
  console.log(
    `Starting chat on ${selectedChatModel} with model ${model.modelId}`,
  );

  const documentPreppedMessages = (await prepareDocumentMessages(
    messages,
    selectedChatModel,
    subjectId,
    organizationId || undefined,
  )) as Message[];

  const startTime3 = performance.now();
  let endTime3: number | null = null;
  const stream = createDataStream({
    execute: (dataStream) => {
      const result = streamText({
        model,
        system: systemPrompt,
        messages: documentPreppedMessages,
        experimental_transform: smoothStream({ chunking: "word" }),
        experimental_generateMessageId: generateUUID,
        onChunk: async ({ chunk: _chunk }) => {
          if (!endTime3) {
            endTime3 = performance.now();
            console.log(
              `Time to onChunk took: ${((endTime3 - startTime3) / 1000).toFixed(2)} seconds`,
            );
          }
        },
        onFinish: async ({ response, usage }) => {
          console.log("🚀 ~ onFinish: ~ usage:", usage);
          // Save the ORIGINAL message to DB (not the enhanced one)
          // This ensures the UI shows the clean user input
          if (response.messages.length === 0) {
            throw new Error("No response messages found!");
          }
          await db.message.create({
            data: {
              chatId: id,
              id: originalMessage.id,
              role: "user",
              parts: originalMessage.parts as any, // Type assertion for DB compatibility
              attachments: [],
              createdAt: new Date(),
            },
          });

          const endTime2 = performance.now();
          console.log(
            `Time to onFinish took: ${((endTime2 - startTime2) / 1000).toFixed(2)} seconds`,
          );

          if (session.user?.id) {
            try {
              const assistantId = getTrailingMessageId({
                messages: response.messages.filter(
                  (message) => message.role === "assistant",
                ),
              });

              if (!assistantId) {
                throw new Error("No assistant message found!");
              }

              const [, assistantMessage] = appendResponseMessages({
                messages: [originalMessage], // Use original message for consistency
                responseMessages: response.messages,
              });

              if (!assistantMessage) {
                throw new Error("No assistant message found!");
              }

              await db.message.create({
                data: {
                  id: assistantId,
                  chatId: id,
                  role: assistantMessage?.role,
                  parts: assistantMessage?.parts as any,
                  attachments:
                    assistantMessage?.experimental_attachments ?? ([] as any),
                  createdAt: new Date(),
                },
              });
            } catch (error) {
              console.error("Failed to save chat");
              console.error(error);
              // await db.message.delete({ where: { id: createdMessage.id } });
            }
          }
        },
      });

      void result.consumeStream();

      result.mergeIntoDataStream(dataStream, {
        sendReasoning: true,
      });
    },
    onError: (error) => {
      console.error(error);
      return "Oops, an error occurred!";
    },
  });

  const streamContext = getStreamContext();

  if (streamContext) {
    return new Response(
      await streamContext.resumableStream(streamId, () => stream),
    );
  } else {
    return new Response(stream);
  }
} catch (error) {
  console.error(error);
  return NextResponse.json(
    { error: "Oops, an error occurred!" },
    { status: 500 },
  );
}
}
