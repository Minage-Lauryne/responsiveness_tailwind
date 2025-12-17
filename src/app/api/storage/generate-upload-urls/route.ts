import { NextRequest, NextResponse } from "next/server";
import { getBetterAuthSessionToken } from "@/lib/session";

const baseUrl = process.env.BASE_URL;


export async function POST(request: NextRequest) {
  try {
    const sessionToken = await getBetterAuthSessionToken();

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json() as { 
      rfp_filename?: string;
      proposal_filenames: string[];
    };
    const target = `${baseUrl}/api/storage/generate-upload-urls/`;

    const response = await fetch(target, {
      method: "POST",
      headers: {
        "Cookie": `auth_session=${sessionToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: errorText || `HTTP ${response.status}: ${response.statusText}` },
        { status: response.status }
      );
    }

    const json = await response.json() as unknown;
    
    return NextResponse.json(json, { status: response.status });
  } catch (error) {
    console.error("Error generating upload URLs:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
