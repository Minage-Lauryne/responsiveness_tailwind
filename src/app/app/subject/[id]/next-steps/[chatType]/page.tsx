import { ChatType } from "@prisma/client";
import SubjectChatPage from "../../components/subject-chat-page";

export default async function Page(props: {
  params: Promise<{ id: string; chatType: ChatType }>;
}) {
  const { id, chatType } = await props.params;

  const chatTypeUpper = chatType.toUpperCase() as ChatType;

  if (!Object.values(ChatType).includes(chatTypeUpper)) {
    return <div>Invalid chat type</div>;
  }

  return <SubjectChatPage id={id} chatType={chatTypeUpper} />;
}
