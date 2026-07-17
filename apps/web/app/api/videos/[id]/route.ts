import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { videos } from "@/db/schema";
import { apiJson, apiOptionsResponse, watchShareUrl } from "@/lib/api";
import {
  badRequest,
  notFound,
  requireApiUserId,
  serverError,
  unauthorized,
} from "@/lib/api-auth";
import { createNotification } from "@/lib/notifications";

export const OPTIONS = () => apiOptionsResponse();

type RouteContext = {
  params: Promise<{ id: string }>;
};

const STATUSES = ["RECORDING", "PROCESSING", "READY", "FAILED"] as const;
type VideoStatus = (typeof STATUSES)[number];

const ALLOWED_TRANSITIONS: Record<VideoStatus, readonly VideoStatus[]> = {
  RECORDING: ["PROCESSING", "READY", "FAILED"],
  PROCESSING: ["READY", "FAILED"],
  READY: ["FAILED"],
  FAILED: [],
};

/**
 * PATCH /api/videos/:id
 * Update status / metadata after capture finishes (or fails).
 */
export async function PATCH(request: Request, context: RouteContext) {
  const userId = await requireApiUserId();
  if (!userId) return unauthorized();

  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      status?: VideoStatus;
      title?: string;
      description?: string | null;
      visibility?: "PRIVATE" | "PUBLIC" | "AUTHENTICATED";
    };

    const [existing] = await db
      .select()
      .from(videos)
      .where(and(eq(videos.id, id), eq(videos.userId, userId)))
      .limit(1);

    if (!existing) {
      return notFound("Video not found.");
    }

    if (body.status !== undefined) {
      if (!STATUSES.includes(body.status)) {
        return badRequest("Invalid status.");
      }

      const current = existing.status as VideoStatus;
      const next = body.status;
      if (next !== current && !ALLOWED_TRANSITIONS[current].includes(next)) {
        return badRequest(`Cannot transition from ${current} to ${next}.`);
      }

      if (next === "READY" && existing.segmentCount < 1) {
        return badRequest("Cannot mark READY with zero segments.");
      }
    }

    const nextTitle =
      body.title !== undefined ? body.title.trim() : existing.title;
    if (!nextTitle) {
      return badRequest("Title is required.");
    }

    const becameReady =
      body.status === "READY" && existing.status !== "READY";

    const [video] = await db
      .update(videos)
      .set({
        status: body.status ?? existing.status,
        title: nextTitle,
        description:
          body.description === undefined
            ? existing.description
            : body.description?.trim() || null,
        visibility: body.visibility ?? existing.visibility,
        updatedAt: new Date(),
      })
      .where(and(eq(videos.id, id), eq(videos.userId, userId)))
      .returning();

    if (becameReady) {
      try {
        await createNotification({
          userId,
          type: "RECORDING_READY",
          entityId: video.id,
        });
      } catch {
        // Status update succeeded; notification is best-effort.
      }
    }

    return apiJson({
      success: true,
      video: {
        id: video.id,
        title: video.title,
        description: video.description,
        status: video.status,
        visibility: video.visibility,
        shareSlug: video.shareSlug,
        segmentCount: video.segmentCount,
        durationSeconds: video.durationSeconds,
        shareUrl: watchShareUrl(request, video.id, video.shareSlug),
      },
    });
  } catch {
    return serverError();
  }
}
