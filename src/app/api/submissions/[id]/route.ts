import { NextRequest, NextResponse } from "next/server";
import { getBetterAuthSessionToken } from "@/lib/session";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    const baseUrl = process.env.BASE_URL;
    if (!baseUrl) {
      return NextResponse.json(
        { error: "BASE_URL environment variable is not set" },
        { status: 500 }
      );
    }

        const sessionToken = await getBetterAuthSessionToken();

    // Get session cookie for authentication


    // Forward request to backend
    const backendUrl = `${baseUrl}/api/submissions/${id}/`;
    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `auth_session=${sessionToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: errorText || "Failed to fetch submission" },
        { status: response.status }
      );
    }

    const data = await response.json() as unknown;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching submission:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
