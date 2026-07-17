import { eq } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";

import { db } from "@/db";
import { videos } from "@/db/schema";
import { getVideoForWatch } from "@/server-actions/video";

/**
 * Short share link → canonical watch page.
 * Access is checked here so PRIVATE links never leak the video UUID via redirect.
 */
const ShortLinkPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;
  const normalized = slug.trim();

  if (!normalized || normalized.length > 16) {
    notFound();
  }

  const [video] = await db
    .select({ id: videos.id })
    .from(videos)
    .where(eq(videos.shareSlug, normalized))
    .limit(1);

  if (!video) {
    notFound();
  }

  const access = await getVideoForWatch(video.id);

  if (!access.success) {
    if (access.status === 401) {
      redirect(
        `/sign-in?redirect_url=${encodeURIComponent(`/r/${normalized}`)}`,
      );
    }
    notFound();
  }

  redirect(`/watch/${video.id}`);
};

export default ShortLinkPage;
