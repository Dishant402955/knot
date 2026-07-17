import { and, count, eq, sql, sum } from "drizzle-orm";

import { db } from "@/db";
import { videoSegments, videos } from "@/db/schema";
import { apiJson, apiOptionsResponse } from "@/lib/api";
import {
  badRequest,
  notFound,
  requireApiUserId,
  serverError,
  unauthorized,
} from "@/lib/api-auth";
import { segmentStorageKey, MAX_SEGMENT_INDEX } from "@/lib/b2";

export const OPTIONS = () => apiOptionsResponse();

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/videos/:id/segments
 * Register a segment after the desktop PUTs the chunk to B2.
 * storageKey is always derived server-side; client value must match if sent.
 */
export async function POST(request: Request, context: RouteContext) {
  const userId = await requireApiUserId();
  if (!userId) return unauthorized();

  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      index?: number;
      storageKey?: string;
      durationSeconds?: number;
      size?: number;
    };

    if (
      body.index === undefined ||
      !Number.isInteger(body.index) ||
      body.index < 0 ||
      body.index > MAX_SEGMENT_INDEX
    ) {
      return badRequest(
        `index must be an integer between 0 and ${MAX_SEGMENT_INDEX}.`,
      );
    }

    const expectedKey = segmentStorageKey(userId, id, body.index);
    const clientKey = body.storageKey?.trim();
    if (clientKey && clientKey !== expectedKey) {
      return badRequest("storageKey does not match the expected object key.");
    }

    const durationSeconds =
      typeof body.durationSeconds === "number" && body.durationSeconds >= 0
        ? Math.round(body.durationSeconds)
        : 5;

    const [video] = await db
      .select()
      .from(videos)
      .where(and(eq(videos.id, id), eq(videos.userId, userId)))
      .limit(1);

    if (!video) {
      return notFound("Video not found.");
    }

    if (video.status === "READY" || video.status === "FAILED") {
      return badRequest(`Cannot register segments on a ${video.status} video.`);
    }

    const sizeValue =
      typeof body.size === "number" && body.size >= 0
        ? Math.round(body.size)
        : null;

    const [segment] = await db
      .insert(videoSegments)
      .values({
        videoId: id,
        index: body.index,
        storageKey: expectedKey,
        durationSeconds,
        size: sizeValue,
      })
      .onConflictDoUpdate({
        target: [videoSegments.videoId, videoSegments.index],
        set: {
          storageKey: expectedKey,
          durationSeconds,
          size: sizeValue,
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
