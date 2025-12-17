export function getEvalUserMessage(
  context: string,
  documents: {
    name: string;
    fileType: string;
  }[],
) {
  const message = `Please analyze this nonprofit program evaluation:

**Context:** ${context}

${documents.length > 0 ? `**Documents provided:**\n${documents?.map((doc) => `- ${doc.name} (${doc.fileType})`).join("\n")}` : ""}


Please provide a comprehensive analysis based on the documents provided.`;

  return message;
}
