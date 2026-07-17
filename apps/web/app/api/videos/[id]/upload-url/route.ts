import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { videos } from "@/db/schema";
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
  getSignedUploadUrl,
  isB2Configured,
  MAX_SEGMENT_INDEX,
  segmentStorageKey,
} from "@/lib/b2";

export const OPTIONS = () => apiOptionsResponse();

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/videos/:id/upload-url
 * Presigned B2 PUT for chunk index n.
 */
export async function POST(request: Request, context: RouteContext) {
  const userId = await requireApiUserId();
  if (!userId) return unauthorized();

  if (!isB2Configured()) {
    return serviceUnavailable(
      "B2 is not configured. Set B2_KEY_ID, B2_APPLICATION_KEY, and B2_BUCKET.",
    );
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      index?: number;
      contentType?: string;
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

    const contentType = body.contentType?.trim() || "video/webm";
    const storageKey = segmentStorageKey(userId, id, body.index);
    const uploadUrl = await getSignedUploadUrl(storageKey, contentType);

    return apiJson({
      success: true,
      index: body.index,
      storageKey,
      uploadUrl,
      contentType,
    });
  } catch {
    return serverError();
  }
}
