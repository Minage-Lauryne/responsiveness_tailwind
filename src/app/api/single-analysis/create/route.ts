import { NextResponse } from "next/server";
import { getBetterAuthSessionToken } from "@/lib/session";
import type { CreateAnalysisRequest, SingleAnalysisResponse } from "@/types/single-analysis";

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

    const body = (await request.json()) as CreateAnalysisRequest;

    if (!body.document_paths?.length && !body.message?.trim()) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: {
            non_field_errors: [
              "At least one of 'document_paths' or 'message' must be provided.",
            ],
          },
        },
        { status: 400 }
      );
    }


    const djangoRequest = {
      document_paths: body.document_paths,
      message: body.message,
      chat_type: body.chat_type,
      domain: body.domain,
      top_k: body.top_k,
      max_tokens: body.max_tokens,
      parent_analysis_id: body.parent_analysis_id,
    };

    const djangoResponse = await fetch(
      `${DJANGO_API_URL}/api/single-analysis/storage/create-from-urls/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cookie": `auth_session=${sessionToken}`,
        },
        body: JSON.stringify(djangoRequest),
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

    const data = (await djangoResponse.json()) as SingleAnalysisResponse;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Create analysis error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
