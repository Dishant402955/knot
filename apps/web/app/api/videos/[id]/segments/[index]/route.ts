import { and, count, eq, sql, sum } from "drizzle-orm";

import { db } from "@/db";
import { videoSegments, videos } from "@/db/schema";
import { apiJson, apiOptionsResponse } from "@/lib/api";
import {
  badRequest,
  notFound,
  requireApiUserId,
  serverError,
  serviceUnavailable,
  unauthorized,
} from "@/lib/api-auth";
import {
  isB2Configured,
  MAX_SEGMENT_BYTES,
  MAX_SEGMENT_INDEX,
  putSegmentObject,
  segmentStorageKey,
} from "@/lib/b2";

export const OPTIONS = () => apiOptionsResponse();

/** Allow longer uploads on Node hosts (Vercel maxDuration is plan-limited). */
export const maxDuration = 60;

type RouteContext = {
  params: Promise<{ id: string; index: string }>;
};

/**
 * PUT /api/videos/:id/segments/:index
 * Accept chunk bytes from desktop → PutObject on B2 → register segment.
 * Prefer this over presigned client→B2 (works behind corporate filters when
 * the API host can reach B2).
 */
export async function PUT(request: Request, context: RouteContext) {
  const userId = await requireApiUserId();
  if (!userId) return unauthorized();

  if (!isB2Configured()) {
    return serviceUnavailable(
      "B2 is not configured. Set B2_KEY_ID, B2_APPLICATION_KEY, and B2_BUCKET.",
    );
  }

  try {
    const { id, index: indexRaw } = await context.params;
    const index = Number(indexRaw);

    if (!Number.isInteger(index) || index < 0 || index > MAX_SEGMENT_INDEX) {
      return badRequest("index must be an integer between 0 and 10000.");
    }

    const contentType = request.headers.get("content-type")?.trim() || "";
    if (contentType && !contentType.startsWith("video/webm")) {
      return badRequest("Content-Type must be video/webm.");
    }

    const durationHeader = request.headers.get("x-duration-seconds");
    const durationSeconds = durationHeader
      ? Math.max(0, Math.round(Number(durationHeader)))
      : 5;
    if (!Number.isFinite(durationSeconds)) {
      return badRequest("X-Duration-Seconds must be a number.");
    }

    const [video] = await db
      .select()
      .from(videos)
      .where(and(eq(videos.id, id), eq(videos.userId, userId)))
      .limit(1);

    if (!video) {
      return notFound("Video not found.");
    }

    if (video.status === "READY" || video.status === "FAILED") {
      return badRequest(`Cannot upload to a ${video.status} video.`);
    }

    const buffer = Buffer.from(await request.arrayBuffer());
    if (buffer.byteLength === 0) {
      return badRequest("Empty body.");
    }
    if (buffer.byteLength > MAX_SEGMENT_BYTES) {
      return badRequest(`Segment exceeds ${MAX_SEGMENT_BYTES} byte limit.`);
    }

    const storageKey = segmentStorageKey(userId, id, index);
    const mime = contentType.startsWith("video/webm")
      ? contentType.split(";")[0]!.trim()
      : "video/webm";

    try {
      await putSegmentObject(storageKey, buffer, mime);
    } catch (error) {
      if (error instanceof Error && error.name === "B2NetworkBlockedError") {
        return serviceUnavailable(error.message);
      }
      console.error("[knot] PutObject failed:", error);
      return serverError("Failed to store segment.");
    }

    const [segment] = await db
      .insert(videoSegments)
      .values({
        videoId: id,
        index,
        storageKey,
        durationSeconds,
        size: buffer.byteLength,
      })
      .onConflictDoUpdate({
        target: [videoSegments.videoId, videoSegments.index],
        set: {
          storageKey,
          durationSeconds,
          size: buffer.byteLength,
        },
      })
      .returning();

    const [stats] = await db
      .select({
        segmentCount: count(),
        durationSeconds: sql<number>`coalesce(${sum(videoSegments.durationSeconds)}, 0)::int`,
      })
      .from(videoSegments)
      .where(eq(videoSegments.videoId, id));

    const [updated] = await db
      .update(videos)
      .set({
        segmentCount: Number(stats.segmentCount),
        durationSeconds: Number(stats.durationSeconds),
        updatedAt: new Date(),
      })
      .where(eq(videos.id, id))
      .returning();

    return apiJson(
      {
        success: true,
        segment: {
          id: segment.id,
          index: segment.index,
          storageKey: segment.storageKey,
          durationSeconds: segment.durationSeconds,
          size: segment.size,
        },
        video: {
          id: updated.id,
          status: updated.status,
          segmentCount: updated.segmentCount,
          durationSeconds: updated.durationSeconds,
        },
      },
      201,
    );
  } catch {
    return serverError();
  }
}
