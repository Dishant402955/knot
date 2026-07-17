import "dotenv/config";
import { config } from "dotenv";
import { resolve } from "node:path";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

config({ path: resolve(process.cwd(), ".env.local"), override: true });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set.");
  }

  const db = drizzle(url);

  const tables = await db.execute(sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);

  const counts = await db.execute(sql`
    SELECT
      (SELECT count(*)::int FROM folders) AS folders,
      (SELECT count(*)::int FROM videos) AS videos,
      (SELECT count(*)::int FROM video_segments) AS video_segments,
      (SELECT count(*)::int FROM comments) AS comments,
      (SELECT count(*)::int FROM notifications) AS notifications
  `);

  const migrations = await db.execute(sql`
    SELECT id, hash, created_at
    FROM drizzle.__drizzle_migrations
    ORDER BY created_at
  `);

  console.log("[db] public tables:", tables.rows.map((r) => r.table_name).join(", "));
  console.log("[db] row counts:", counts.rows[0]);
  console.log(
    "[db] applied migrations:",
    migrations.rows.length
      ? migrations.rows.map((r) => `${r.id} (${r.hash})`).join(", ")
      : "(none)",
  );
}

main().catch((error) => {
  console.error("[db] Check failed:", error);
  process.exit(1);
});
