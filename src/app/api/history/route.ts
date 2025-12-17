import { headers as getHeaders } from "next/headers";

import { auth } from "@/lib/auth";
import { getChatsByUserId } from "@/services/db/queries";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await getHeaders()
  });

  if (!session?.user?.id) {
    return Response.json("Unauthorized!", { status: 401 });
  }

  const chats = await getChatsByUserId({ id: session.user.id });
  return Response.json(chats);
}
