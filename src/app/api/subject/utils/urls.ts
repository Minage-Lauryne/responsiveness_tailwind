import { getSignedDownloadUrl, USER_UPLOADS_BUCKET } from "@/services/supabase";
import { WorkspaceDocument } from "@prisma/client";
import { Attachment } from "ai";

export async function convertAttachmentsToSignedUrls(
  attachments: WorkspaceDocument[],
): Promise<Attachment[]> {
  const signedAttachments = await Promise.all(
    attachments.map(async (attachment) => {
      const signedUrl = await getSignedDownloadUrl(
        USER_UPLOADS_BUCKET,
        attachment.supabaseURL,
        3600, // 1 hour
      );
      return {
        name: attachment.name,
        contentType: attachment.fileType,
        url: signedUrl,
      };
    }),
  );

  return signedAttachments;
}
