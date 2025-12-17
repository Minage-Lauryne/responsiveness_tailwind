import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { headers as getHeaders } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";

const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: "File size should be less than 5MB",
    })
    .refine(
      (file) =>
        ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type),
      {
        message: "File type should be JPEG, PNG, or WebP",
      },
    ),
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await getHeaders() });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (request.body === null) {
    return new Response("Request body is empty", { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as Blob;
    const organizationId = formData.get("organizationId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!organizationId) {
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
    }

    const member = await db.member.findFirst({
      where: {
        userId: session.user.id,
        organizationId,
        role: "ADMIN",
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const validatedFile = FileSchema.safeParse({ file });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.errors
        .map((error) => error.message)
        .join(", ");

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const filename = (formData.get("file") as File).name;
    const fileExtension = filename.split(".").pop();
    const uniqueFilename = `organization-logos/${organizationId}-${Date.now()}.${fileExtension}`;
    const fileBuffer = await file.arrayBuffer();

    try {
      const blob = await put(uniqueFilename, fileBuffer, {
        access: "public",
      });

      return NextResponse.json({ url: blob.url });
    } catch (error) {
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}