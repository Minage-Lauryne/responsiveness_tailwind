import db from "@/server/db";
import { getSignedDownloadUrl, USER_UPLOADS_BUCKET } from "@/services/supabase";

export interface DocumentUrl {
  name: string;
  url: string;
  fileType: string;
}

/**
 * Generates signed URLs for a list of document IDs
 * Used for creating time-limited access to documents in email templates
 */
export async function generateDocumentUrlsForEmail(
  documentIds: string[],
): Promise<DocumentUrl[]> {
  if (!documentIds.length) {
    return [];
  }

  try {
    // Fetch WorkspaceDocument records
    const documents = await db.workspaceDocument.findMany({
      where: {
        id: {
          in: documentIds,
        },
      },
      select: {
        id: true,
        name: true,
        fileType: true,
        supabaseURL: true,
      },
    });

    // Generate signed URLs for each document
    const documentUrls = await Promise.all(
      documents.map(async (doc) => {
        try {
          // Generate 7-day signed URL (604800 seconds)
          const signedUrl = await getSignedDownloadUrl(
            USER_UPLOADS_BUCKET,
            doc.supabaseURL,
            604800, // 7 days
          );

          return {
            name: doc.name,
            url: signedUrl,
            fileType: doc.fileType,
          };
        } catch (error) {
          console.error(
            `Failed to generate signed URL for document ${doc.id}:`,
            error,
          );
          // Return document without URL if signing fails
          return {
            name: doc.name,
            url: "", // Empty URL indicates failure
            fileType: doc.fileType,
          };
        }
      }),
    );

    return documentUrls;
  } catch (error) {
    console.error("Failed to fetch documents for URL generation:", error);
    return [];
  }
}

/**
 * Generates signed URLs for both subject documents and request documents
 * Distinguishes between the two types for proper email template rendering
 */
export async function generateSubjectAndRequestDocumentUrls(
  subjectId: string | null,
  requestDocumentIds: string[],
): Promise<{
  subjectDocuments: DocumentUrl[];
  requestDocuments: DocumentUrl[];
}> {
  let subjectDocuments: DocumentUrl[] = [];
  const requestDocuments =
    await generateDocumentUrlsForEmail(requestDocumentIds);

  // If subjectId is provided, fetch subject's documents
  if (subjectId) {
    const subject = await db.subject.findUnique({
      where: {
        id: subjectId,
      },
      select: {
        documents: {
          select: {
            id: true,
            name: true,
            fileType: true,
            supabaseURL: true,
          },
        },
      },
    });

    if (subject?.documents.length) {
      // Generate signed URLs for subject documents
      subjectDocuments = await Promise.all(
        subject.documents.map(async (doc) => {
          try {
            // Generate 7-day signed URL (604800 seconds)
            const signedUrl = await getSignedDownloadUrl(
              USER_UPLOADS_BUCKET,
              doc.supabaseURL,
              604800, // 7 days
            );

            return {
              name: doc.name,
              url: signedUrl,
              fileType: doc.fileType,
            };
          } catch (error) {
            console.error(
              `Failed to generate signed URL for subject document ${doc.id}:`,
              error,
            );
            // Return document without URL if signing fails
            return {
              name: doc.name,
              url: "", // Empty URL indicates failure
              fileType: doc.fileType,
            };
          }
        }),
      );
    }
  }

  return {
    subjectDocuments,
    requestDocuments,
  };
}
