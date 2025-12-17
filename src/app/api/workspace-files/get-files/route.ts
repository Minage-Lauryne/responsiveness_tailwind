import { NextResponse } from "next/server";
import { getSignedDownloadUrl, USER_UPLOADS_BUCKET } from "@/services/supabase";
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

    const filesWithUrls = await Promise.all(
      files.map(async (file) => {
        if (!file.supabaseURL) {
          throw new Error(`File ${file.id} (${file.name}) has no supabaseURL`);
        }

        const downloadUrl = await getSignedDownloadUrl(
          USER_UPLOADS_BUCKET,
          file.supabaseURL,
          3600 
        );

        return {
          id: file.id,
          name: file.name,
          downloadUrl,
        };
      })
    );

    return NextResponse.json({ files: filesWithUrls });
  } catch (error) {
    console.error("Get files error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
