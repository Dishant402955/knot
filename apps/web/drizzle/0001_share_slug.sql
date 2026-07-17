-- Short share slugs for /r/{slug} links (idempotent).

ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "share_slug" varchar(16);--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "videos_share_slug_unique" ON "videos" ("share_slug");--> statement-breakpoint

-- Backfill existing rows from a stable hash of the video id (collision-resistant enough at 10 chars).
UPDATE "videos"
SET "share_slug" = substr(md5(id::text), 1, 10)
WHERE "share_slug" IS NULL;
