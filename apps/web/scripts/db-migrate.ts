import "dotenv/config";
import { config } from "dotenv";
import { resolve } from "node:path";

// Prefer .env.local over .env when present (Next.js convention).
config({ path: resolve(process.cwd(), ".env.local"), override: true });

import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set.");
  }

  const db = drizzle(url);

  console.log("[db] Applying migrations (idempotent baseline)…");
  await migrate(db, { migrationsFolder: resolve(process.cwd(), "drizzle") });
  console.log("[db] Migrations complete.");
}

main().catch((error) => {
  console.error("[db] Migration failed:", error);
  process.exit(1);
});
