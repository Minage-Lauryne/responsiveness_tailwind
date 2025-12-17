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

    const formData = await request.formData();
    const target = `${baseUrl}/api/comparative-analysis/`;
    

    const response = await fetch(target, {
      method: "POST",
      body: formData,
      headers: {
        "Cookie": `auth_session=${sessionToken}`,
      },
    });

    const json = await response.json();
    
    return NextResponse.json(json, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionToken = await getBetterAuthSessionToken();

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    
    // If ID provided, get single submission, otherwise list all
    const endpoint = id 
      ? `${baseUrl}/api/comparative-analysis/${id}/`
      : `${baseUrl}/api/comparative-analysis/`;

    console.log(`[API /analyze] Fetching from backend: ${endpoint}`);

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Cookie": `auth_session=${sessionToken}`,
      },
    });

    console.log(`[API /analyze] Backend response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API /analyze] Backend error:`, errorText);
      return NextResponse.json(
        { error: errorText || "Failed to fetch analysis" },
        { status: response.status }
      );
    }

    const json = await response.json();
    
    return NextResponse.json(json, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sessionToken = await getBetterAuthSessionToken();

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { error: "ID required" },
        { status: 400 }
      );
    }

    const response = await fetch(`${baseUrl}/api/comparative-analysis/${id}/`, {
      method: "DELETE",
      headers: {
        "Cookie": `auth_session=${sessionToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error },
        { status: response.status }
      );
    }
    
    return NextResponse.json({ success: true }, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
