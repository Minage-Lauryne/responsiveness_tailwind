import { env } from "@/create-env";
import { createId } from "@paralleldrive/cuid2";
import { createClient } from "@supabase/supabase-js";
import { buildSupabasePublicUrl } from "@/lib/storage";
import path from "path";


const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

export const RESEARCH_BUCKET = "research";
export const USER_UPLOADS_BUCKET = "user-uploads";
export const OLD_USER_UPLOADS_BUCKET = "media";

export const supabaseAdminClient = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
);

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export async function getDocument(url: string) {
  const { data: fileData, error } = await supabaseAdminClient.storage
    .from(USER_UPLOADS_BUCKET)
    .download(url);

  if (error || !fileData) {
    throw new Error("Failed to download file from Supabase");
  }

  return fileData;
}

export async function listBucketFiles(bucketName: string, path = "") {
  try {
    const { data, error } = await supabaseAdminClient.storage
      .from(bucketName)
      .list(path);

    if (error) {
      console.error("Error listing files:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Failed to list files:", error);
    throw error;
  }
}

export async function uploadFile(
  bucketName: string,
  filePath: string,
  fileData: string | ArrayBuffer | Blob,
  options?: { contentType?: string; upsert?: boolean },
) {
  try {
    const { data, error } = await supabaseAdminClient.storage
      .from(bucketName)
      .upload(filePath, fileData, options);

    if (error) {
      console.error("Error uploading file:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Failed to upload file:", error);
    throw error;
  }
}


export async function getUploadUrl(userId: string, fileName: string, bucketName = USER_UPLOADS_BUCKET) {
  const id = createId();

  const fileExtension = path.extname(fileName);

  const filePath = `${userId}/${id}${fileExtension}`;

  try {
    const { data, error } = await supabaseAdminClient.storage
      .from(bucketName)
      .createSignedUploadUrl(filePath);

    if (error) {
      console.error("Error getting signed upload URL:", error);
      throw error;
    }
    const publicUrl = supabaseUrl
      ? `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${encodeURIComponent(bucketName)}/${encodeURIComponent(filePath)}`
      : undefined;

    return {
      signedUrl: data.signedUrl,
      token: data.token,
      path: data.path,
      publicUrl,
    };
  } catch (error) {
    console.error("Failed to get signed upload URL:", error);
    throw error;
  }
}
export async function getSignedDownloadUrl(
  bucketName: string,
  filePath: string,
  expiresIn = 3600,
) {
  try {
    const { data, error } = await supabaseAdminClient.storage
      .from(bucketName)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error("Error getting signed download URL:", error);
      throw error;
    }

    return data.signedUrl;
  } catch (error) {
    console.error("Failed to get signed download URL:", error);
    throw error;
  }
}
