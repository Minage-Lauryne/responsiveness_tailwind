import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import db from "@/server/db";
import { getSignedDownloadUrl, USER_UPLOADS_BUCKET } from "@/services/supabase";
import { sanitizeFilename } from "@/lib/filename-utils";

const DJANGO_API_URL = process.env.DJANGO_API_URL;

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
      fileIds: string[];
      context?: string;
      chatType?: string;
    };

    const { fileIds, context, chatType = "ANALYSIS" } = body;

    const dbFiles = await db.workspaceDocument.findMany({
      where: {
        id: { in: fileIds },
      },
      select: {
        id: true,
        name: true,
        supabaseURL: true,
      },
    });

    if (dbFiles.length !== fileIds.length) {
      return NextResponse.json(
        { error: "Some files not found" },
        { status: 404 }
      );
    }

    const files = await Promise.all(
      dbFiles.map(async (file) => {
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

    const sanitizedFilenames = files.map((f) => sanitizeFilename(f.name));
    
    const generateUrlsResponse = await fetch(
      `${DJANGO_API_URL}/api/single-analysis-storage/generate-upload-urls/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `auth_session=${session.session.token}`,
        },
        body: JSON.stringify({
          filenames: sanitizedFilenames,
          chat_type: chatType,
        }),
      }
    );

    if (!generateUrlsResponse.ok) {
      const errorText = await generateUrlsResponse.text();
      console.error("Django generate URLs error:", errorText);
      throw new Error("Failed to generate upload URLs");
    }

    const { document_uploads } = (await generateUrlsResponse.json()) as {
      document_uploads: Array<{
        upload_url: string;
        file_path: string;
        filename: string;
      }>;
    };

    const uploadPromises = files.map(async (file, index) => {
      const uploadInfo = document_uploads[index];
      if (!uploadInfo) {
        throw new Error(`No upload info for file: ${file.name}`);
      }

      const downloadResponse = await fetch(file.downloadUrl);
      if (!downloadResponse.ok) {
        throw new Error(`Failed to download file: ${file.name}`);
      }

      const fileBlob = await downloadResponse.blob();

      const uploadResponse = await fetch(uploadInfo.upload_url, {
        method: "PUT",
        headers: {
          "Content-Type": fileBlob.type || "application/octet-stream",
        },
        body: fileBlob,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload file: ${file.name}`);
      }

      return uploadInfo.file_path;
    });

    const uploadedPaths = await Promise.all(uploadPromises);

    const analysisResponse = await fetch(
      `${DJANGO_API_URL}/api/single-analysis/storage/create-from-urls/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `auth_session=${session.session.token}`,
        },
        body: JSON.stringify({
          document_paths: uploadedPaths,
          message: context || undefined,
          chat_type: chatType,
        }),
      }
    );

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      console.error("Django create analysis error:", errorText);
      return NextResponse.json(
        { error: "Failed to create analysis" },
        { status: analysisResponse.status }
      );
    }

    const analysis = await analysisResponse.json();
    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Create analysis from workspace error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create analysis from workspace",
      },
      { status: 500 }
    );
  }
}
