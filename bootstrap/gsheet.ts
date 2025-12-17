import { createId } from "@paralleldrive/cuid2";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { db } from "@/server/db";

const SPREADSHEET_ID = "1C0zGsUWZjAdk__gOpCYqV1kA_iwAFfIE90tEhyOBS9E";

async function main() {
  try {
    const doc = new GoogleSpreadsheet(SPREADSHEET_ID, {
      apiKey: process.env.GOOGLE_API_KEY!,
    });

    await doc.loadInfo();
    console.log(`Loaded doc: ${doc.title}`);

    const sheet = doc.sheetsByIndex[0];
    if (!sheet) {
      throw new Error("No sheet found in the spreadsheet");
    }

    // Load all rows
    const rows = await sheet.getRows();

    // Convert rows to ResearchDocument objects and create them in the database
    let successCount = 0;
    let errorCount = 0;

    for (const row of rows) {
      try {
        // Generate a unique ID for the document
        const id = createId();

        // Create the document in the database
        await db.researchDocument.create({
          data: {
            id,
            abstract: row.get("abstract") || "",
            citation: row.get("citation") || "",
            studyTitle: row.get("study_title") || "",
            studyLink: row.get("study_link") || "",
            gdiveLink: row.get("gdive_link") || "",
            metaAnalysisTitle: row.get("meta_analysis_title") || "",
            wsippLink: row.get("wsipp_link") || "",
            gdriveMetaAnalysisLink: row.get("gdrive_meta_analysis_link") || "",
            status: row.get("status") || "",
            fileUrl: row.get("study_link") || "",
            fileType: "application/pdf",
            wordCount: 0, // This will be updated when the full text is processed
            uploadDate: new Date(),
          },
        });

        successCount++;
        console.log(`✅ Created document: ${row.get("study_title")}`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to create row:`, error);
      }
    }

    // Log the final results
    console.log(`
Import completed:
✅ Successfully created: ${successCount} documents
❌ Failed to create: ${errorCount} documents
    `);
  } catch (error) {
    console.error("Error importing from Google Sheets:", error);
    process.exit(1);
  }
}

void main();
