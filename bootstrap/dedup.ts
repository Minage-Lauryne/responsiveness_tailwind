import { dedup } from "@/features/research/dedup";

async function main() {
  try {
    await dedup();

    console.log("\nDedup process completed successfully!");
  } catch (error) {
    console.error("Error in dedup process:", error);
    process.exit(1);
  }
}

void main();
