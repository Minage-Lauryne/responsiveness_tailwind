import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  try {
    // Find or create SYSTEM user
    let systemUser = await prisma.user.findUnique({
      where: { email: "system@billiam.company" },
    });

    if (!systemUser) {
      systemUser = await prisma.user.create({
        data: {
          name: "SYSTEM",
          email: "system@billiam.company",
        },
      });
    } else {
      await prisma.user.update({
        where: { id: systemUser.id },
        data: {
          updatedAt: new Date(),
        },
      });
    }

    return new Response("Health check completed successfully");
  } catch (error) {
    console.error("Health check failed:", error);
    return new Response("Health check failed", { status: 500 });
  }
}
