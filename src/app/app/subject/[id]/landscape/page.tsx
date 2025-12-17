import { ChatType } from "@prisma/client";
import SubjectChatPage from "../components/subject-chat-page";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  return <SubjectChatPage id={id} chatType={ChatType.LANDSCAPE_ANALYSIS} />;
}
