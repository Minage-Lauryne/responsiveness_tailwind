import { NextResponse } from "next/server";
import { getBetterAuthSessionToken } from "@/lib/session";
import type { ChatRequest, ChatResponse } from "@/types/single-analysis";

const DJANGO_API_URL = process.env.DJANGO_API_URL;


export async function POST(request: Request) {
  try {
    const sessionToken = await getBetterAuthSessionToken();

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as ChatRequest;

    if (!body.analysis_id) {
      return NextResponse.json(
        { error: "analysis_id is required" },
        { status: 400 }
      );
    }

    if (!body.message?.trim()) {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 }
      );
    }

    const djangoResponse = await fetch(
      `${DJANGO_API_URL}/api/single-analysis-chats/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cookie": `auth_session=${sessionToken}`,
        },
        body: JSON.stringify(body),
      }
    );

    if (!djangoResponse.ok) {
      const errorText = await djangoResponse.text();
      let errorData: { error: string; details?: unknown };
      try {
        errorData = JSON.parse(errorText) as { error: string; details?: unknown };
      } catch {
        errorData = { error: errorText };
      }

      return NextResponse.json(
        errorData,
        { status: djangoResponse.status }
      );
    }

    const data = (await djangoResponse.json()) as ChatResponse;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
