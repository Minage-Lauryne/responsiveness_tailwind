import db from "@/server/db";
import { ChatType } from "@prisma/client";
import { Message } from "ai";

export async function prepareDocumentMessages(
  messages: Message[],
  chatType: ChatType,
  subjectId: string,
  organizationId?: string,
) {

  const subject = await db.subject.findFirstOrThrow({
    where: {
      id: subjectId,
      ...(organizationId && { organizationId }),
    },
    include: {
      documents: true,
    },
  });

  // If no messages, return as-is
  if (messages.length === 0) {
    return messages;
  }

  // Get the first message
  const firstMessage = messages[0];
  const restMessages = messages.slice(1);

  if (!firstMessage) {
    return messages;
  }

  // Create the enhanced first message
  const content = getContent(
    chatType,
    subject.context,
    subject.documents
      .filter((document) => document.rawText)
      .map((document) => ({
        name: document.name,
        rawText: document.rawText ?? "",
      })),
  );

  return [
    {
      content: content,
      role: "user",
    },
    ...restMessages,
  ];
}

function getContent(
  chatType: ChatType,
  context: string,
  documentsWithContent: {
    name: string;
    rawText: string;
  }[],
): string {
  let enhancedContent = `Please base your analysis on my inputs here.`;

  // Add context if it exists
  if (context) {
    enhancedContent += `\n\nI have provided the following context: ${context}`;
  }

  // Add document information if documents exist
  if (documentsWithContent.length > 0) {
    enhancedContent += `\n\nAnd have included information from several documents.

## Documents

Overall, I have provided ${documentsWithContent.length} document${documentsWithContent.length > 1 ? "s" : ""}. Here are their names:
${documentsWithContent.map((doc) => `- ${doc.name}`).join("\n")}

Below is the extracted text for each:`;

    for (const document of documentsWithContent) {
      enhancedContent += `\n\n### ${document.name}\n\n${document.rawText}`;
    }
  }

  // Add the original user message content
  enhancedContent += `\n\n---\n\n`;

  return enhancedContent;
}
