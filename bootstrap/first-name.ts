import { db } from "@/server/db";

async function main() {
  try {
    const users = await db.user.findMany();

    for (const user of users) {
      const firstName = user.name?.split(" ")[0];
      if (!firstName || firstName.trim() === "") {
        console.log(`Skipping user ${user.id} because they have no first name`);
        continue;
      }

      await db.user.update({
        where: { id: user.id },
        data: { firstName },
      });
      console.log(`Updated user ${user.id} with first name ${firstName}`);
    }
  } catch (error) {
    console.error("Error importing from Google Sheets:", error);
    process.exit(1);
  }
}

void main();
