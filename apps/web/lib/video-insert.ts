import { db } from "@/db";
import { videos } from "@/db/schema";
import { generateShareSlug } from "@/lib/share-slug";

type VideoInsert = typeof videos.$inferInsert;

/** Insert a video row, retrying on rare share_slug collisions. */
export const insertVideoWithSlug = async (
  values: Omit<VideoInsert, "shareSlug"> & { shareSlug?: string },
) => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const shareSlug = values.shareSlug ?? generateShareSlug();
    try {
      const [video] = await db
        .insert(videos)
        .values({ ...values, shareSlug })
        .returning();
      return video;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/unique|duplicate/i.test(message) && attempt < 4) continue;
      throw error;
    }
  }
  throw new Error("Could not allocate share slug.");
};
