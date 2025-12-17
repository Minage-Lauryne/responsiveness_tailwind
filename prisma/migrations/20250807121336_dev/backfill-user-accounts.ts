import { PrismaClient } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";

const prisma = new PrismaClient();

// After applying the sibling schema changes, existing users are not backed by
// an Account entity yet. To ensure a smooth transition to BetterAuth, this script
// backfills an Account entity for each user that already exists.
async function main() {
  await prisma.$transaction(async (tx) => {
    const users = await tx.user.findMany();
    for (const user of users) {
      const exists = await tx.account.findFirst({
        where: { userId: user.id },
      });
      if (exists) {
        console.warn(
          `Account for user with id ${user.id} is already present, will not backfill.`,
        );
        continue;
      }

      const now = new Date();
      await tx.account.create({
        data: {
          id: createId(),
          userId: user.id,
          accountId: user.id,
          providerId: "credential",
          createdAt: now,
          updatedAt: now,
        },
      });
    }
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
