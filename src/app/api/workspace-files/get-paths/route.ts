import { NextResponse } from "next/server";
import { getBetterAuthSessionToken } from "@/lib/session";
import db from "@/server/db";
import { auth } from "@/lib/auth";
import { headers as getHeaders } from "next/headers";


export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await getHeaders(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { fileIds } = (await request.json()) as { fileIds: string[] };

    if (!fileIds || fileIds.length === 0) {
      return NextResponse.json(
        { error: "File IDs are required" },
        { status: 400 }
      );
    }

    const files = await db.workspaceDocument.findMany({
      where: {
        id: { in: fileIds },
      },
      select: {
        id: true,
        name: true,
        supabaseURL: true,
      },
    });

    if (files.length !== fileIds.length) {
      return NextResponse.json(
        { error: "Some files not found" },
        { status: 404 }
      );
    }

  
    const filePaths = files.map((file) => {
      if (!file.supabaseURL) {
        throw new Error(`File ${file.id} (${file.name}) has no supabaseURL`);
      }

      const storagePath = `user-uploads/${file.supabaseURL}`;
      return storagePath;
    });

    return NextResponse.json({ filePaths });
  } catch (error) {
    console.error("Get file paths error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
