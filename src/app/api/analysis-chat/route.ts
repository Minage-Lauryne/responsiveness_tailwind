import { NextRequest, NextResponse } from "next/server";
import { getBetterAuthSessionToken } from "@/lib/session";

const baseUrl = process.env.BASE_URL;

export async function POST(request: NextRequest) {
  try {
    const sessionToken = await getBetterAuthSessionToken();
  

    if (!sessionToken) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const incoming = await request.json().catch(() => ({}));
    const submissionId =
      incoming.submission_id ?? incoming.submissionId ?? incoming.submission ?? incoming.submissionId?.toString?.() ?? null;

    let messageText: string | null = null;
    if (typeof incoming.message === "string" && incoming.message.trim().length > 0) {
      messageText = incoming.message.trim();
    } else if (Array.isArray(incoming.messages) && incoming.messages.length > 0) {
      const messages = incoming.messages;
      for (let incomingMessage = messages.length - 1; incomingMessage >= 0; incomingMessage--) {
        const messageReceived = messages[incomingMessage];
        if (!messageReceived) continue;
        if (typeof messageReceived === "string") {
          if (messageReceived.trim()) { messageText = messageReceived.trim(); break; }
        } else if (typeof messageReceived === "object") {
          if (messageReceived.role === "user" && (messageReceived.content || messageReceived.message)) {
            messageText = String(messageReceived.content ?? messageReceived.message).trim();
            break;
          }
          if (messageReceived.content || messageReceived.message) {
            if (!messageText) messageText = String(messageReceived.content ?? messageReceived.message).trim();
          }
        }
      }
    }

    if (!messageText && typeof incoming.text === "string") messageText = incoming.text.trim();

    if (!submissionId) {
      return NextResponse.json({ error: "submission_id is required" }, { status: 400 });
    }
    if (!messageText) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const backendPayload = {
      submission_id: submissionId,
      message: messageText,
      ...(incoming.context ? { context: incoming.context } : {}),
    };



    let lastError: any = null;

      try {
        const response = await fetch(`${baseUrl}/api/chats/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cookie": `auth_session=${sessionToken}`,
          },
          body: JSON.stringify(backendPayload),
        });

        const text = await response.text();
        let json: any;
        try { json = JSON.parse(text); } catch { json = { text }; }

        if (response.status === 404) {
          console.warn(`analysis-chat returned 404, trying next fallback.`);
          return;
        }

        if (!response.ok) {
          return NextResponse.json({ error: text }, { status: response.status });
        }

        return NextResponse.json(json, { status: response.status });
      } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
      }

    const message = lastError ? String(lastError) : "No backend chat endpoint found (404)";
    return NextResponse.json({ error: message }, { status: 502 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}