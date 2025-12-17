import { PrismaClient } from "@prisma/client";
import { addDays } from "date-fns";

const prisma = new PrismaClient();

// After applying the sibling schema changes, existing organizations are not populated
// with a value for trialEndsAt.
async function main() {
  await prisma.$transaction(async (tx) => {
    for (const org of await tx.organization.findMany()) {
      if (org.trialEndsAt !== null) {
        console.log(`Trial data already exists for organization '${org.id}', skipping.`);
        continue;
      }

      const updatedOrg = await tx.organization.update({
        where: { id: org.id },
        data: {
          trialEndsAt: addDays(org.createdAt, 14),
        },
      });

      console.log(`Backfilled trial data for organization '${updatedOrg.id}'.`);
    }
  }, {
    timeout: 60000,
  });
  console.log("Applied data migration with no errors.");
}

main()
  .catch(async (e) => {
    console.error(e);
    process.exit(1);
  })
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  .finally(async () => await prisma.$disconnect());
