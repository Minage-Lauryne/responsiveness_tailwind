import { NextRequest, NextResponse } from "next/server";
import { getBetterAuthSessionToken } from "@/lib/session";

const DJANGO_API_URL = process.env.DJANGO_API_URL;


export async function GET(request: NextRequest) {
  try {
    const sessionToken = await getBetterAuthSessionToken();

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const analysisId = searchParams.get("id");

    if (!analysisId) {
      return NextResponse.json(
        { error: "Analysis ID is required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${DJANGO_API_URL}/api/single-analysis/${analysisId}/`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Cookie: `auth_session=${sessionToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Django error:", errorText);
      return NextResponse.json(
        { error: `Failed to fetch analysis: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Get analysis error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
