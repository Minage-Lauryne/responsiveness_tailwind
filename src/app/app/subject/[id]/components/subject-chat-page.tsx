"use client";

import { convertToUIMessages } from "@/lib/utils/convert-messages";
import { ChatType } from "@prisma/client";
import { GenericSubjectChat } from "./generic-subject-chat";
import { api } from "@/trpc/react";
import { LoadingSpinner } from "@/features/shared/loading-spinner";

export default function SubjectChatPage({
  id,
  chatType,
}: {
  id: string;
  chatType: ChatType;
}) {
  const { data, isLoading, error, isError } = api.chat.getChatBySubjectAndType.useQuery({
    subjectId: id,
    chatType,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-600 mb-2">
            Error Loading Chat
          </h3>
          <p className="text-gray-600">
            {error?.message || "Failed to load chat data. Please try again."}
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No Data Found
          </h3>
          <p className="text-gray-500">
            No chat data available for this subject.
          </p>
        </div>
      </div>
    );
  }

  const { chat, subject } = data;

  if (!subject) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Subject Not Found
          </h3>
          <p className="text-gray-500">
            This subject is not available in your current workspace context.
          </p>
        </div>
      </div>
    );
  }

  const initialMessages = convertToUIMessages(chat?.messages || []);

  return (
    <GenericSubjectChat
      initialMessages={initialMessages}
      subject={subject}
      chatId={chat?.id}
      chatType={chatType}
    />
  );
}
