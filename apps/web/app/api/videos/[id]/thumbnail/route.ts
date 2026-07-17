import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { videos } from "@/db/schema";
import { apiJson, apiOptionsResponse } from "@/lib/api";
import {
  badRequest,
  notFound,
  requireApiUserId,
  serverError,
  unauthorized,
} from "@/lib/api-auth";
import {
  isB2Configured,
  MAX_THUMBNAIL_BYTES,
  putThumbnailObject,
  thumbnailStorageKey,
} from "@/lib/b2";

export const OPTIONS = () => apiOptionsResponse();

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * PUT /api/videos/:id/thumbnail
 * Upload JPEG poster (desktop captures from live canvas after chunk 0).
 */
export async function PUT(request: Request, context: RouteContext) {
  const userId = await requireApiUserId();
  if (!userId) return unauthorized();

  try {
    if (!isB2Configured()) {
      return serverError(
        "Storage is not configured. Set B2_KEY_ID, B2_APPLICATION_KEY, and B2_BUCKET.",
      );
    }

    const { id } = await context.params;

    const [existing] = await db
      .select({ id: videos.id, userId: videos.userId })
      .from(videos)
      .where(and(eq(videos.id, id), eq(videos.userId, userId)))
      .limit(1);

    if (!existing) {
      return notFound("Video not found.");
    }

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().startsWith("image/jpeg")) {
      return badRequest("Content-Type must be image/jpeg.");
    }

    const buffer = Buffer.from(await request.arrayBuffer());
    if (buffer.byteLength === 0) {
      return badRequest("Empty thumbnail body.");
    }
    if (buffer.byteLength > MAX_THUMBNAIL_BYTES) {
      return badRequest(
        `Thumbnail too large (max ${MAX_THUMBNAIL_BYTES} bytes).`,
      );
    }

    const storageKey = thumbnailStorageKey(userId, id);
    await putThumbnailObject(storageKey, buffer, "image/jpeg");

    const [video] = await db
      .update(videos)
      .set({
        thumbnailKey: storageKey,
        updatedAt: new Date(),
      })
      .where(and(eq(videos.id, id), eq(videos.userId, userId)))
      .returning({
        id: videos.id,
        thumbnailKey: videos.thumbnailKey,
      });

    return apiJson({
      success: true,
      video: {
        id: video.id,
        thumbnailKey: video.thumbnailKey,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "B2NetworkBlockedError") {
      return serverError(error.message);
    }
    return serverError();
  }
}
