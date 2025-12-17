import { db } from "@/server/db";

export async function dedup() {
  const researchDocuments = await db.researchDocument.findMany();

  const documentsByTitle = new Map<
    string,
    Array<(typeof researchDocuments)[0]>
  >();

  for (const doc of researchDocuments) {
    const title = doc.studyTitle;
    if (!documentsByTitle.has(title)) {
      documentsByTitle.set(title, []);
    }
    documentsByTitle.get(title)!.push(doc);
  }

  for (const [title, docs] of documentsByTitle.entries()) {
    if (docs.length > 1) {
      console.log(`Found ${docs.length} documents with title: "${title}"`);
      // Keep the first one, delete the rest.
      const docsToDelete = docs.slice(1);
      const idsToDelete = docsToDelete.map((d) => d.id);

      console.log(
        `  Keeping ${docs[0]?.id}, deleting ${idsToDelete.join(", ")}`,
      );

      await db.researchDocument.deleteMany({
        where: {
          id: {
            in: idsToDelete,
          },
        },
      });
    }
  }
}
