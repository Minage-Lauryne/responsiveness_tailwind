import { NextResponse } from "next/server";
import { getBetterAuthSessionToken } from "@/lib/session";
import { sanitizeFilename } from "@/lib/filename-utils";
import type { GenerateUploadURLsRequest, GenerateUploadURLsResponse } from "@/types/single-analysis";

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

    const body = (await request.json()) as GenerateUploadURLsRequest;

    if (!body.filenames || body.filenames.length === 0) {
      return NextResponse.json(
        { error: "At least one filename is required" },
        { status: 400 }
      );
    }

    const sanitizedFilenames = body.filenames.map(sanitizeFilename);

    const djangoResponse = await fetch(
      `${DJANGO_API_URL}/api/single-analysis-storage/generate-upload-urls/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cookie": `auth_session=${sessionToken}`,
        },
        body: JSON.stringify({
          ...body,
          filenames: sanitizedFilenames,
        }),
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

    const data = (await djangoResponse.json()) as GenerateUploadURLsResponse;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Generate upload URLs error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
