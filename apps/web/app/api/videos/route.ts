import { insertVideoWithSlug } from "@/lib/video-insert";
import { apiJson, apiOptionsResponse, watchShareUrl } from "@/lib/api";
import {
  badRequest,
  requireApiUserId,
  serverError,
  unauthorized,
} from "@/lib/api-auth";

export const OPTIONS = () => apiOptionsResponse();

/**
 * POST /api/videos
 * Create a recording session (desktop). Returns share URL immediately.
 * Default visibility is PUBLIC so the share link is watchable without sign-in
 * (dashboard metadata creates still default to PRIVATE).
 */
export async function POST(request: Request) {
  const userId = await requireApiUserId();
  if (!userId) return unauthorized();

  try {
    let title = "Untitled recording";
    let visibility: "PRIVATE" | "PUBLIC" | "AUTHENTICATED" = "PUBLIC";

    try {
      const body = (await request.json()) as {
        title?: string;
        visibility?: "PRIVATE" | "PUBLIC" | "AUTHENTICATED";
      };

      if (body.title?.trim()) title = body.title.trim();
      if (
        body.visibility === "PRIVATE" ||
        body.visibility === "PUBLIC" ||
        body.visibility === "AUTHENTICATED"
      ) {
        visibility = body.visibility;
      }
    } catch {
      // Empty body is fine — use defaults.
    }

    if (!title) {
      return badRequest("Title is required.");
    }

    const video = await insertVideoWithSlug({
      userId,
      title,
      visibility,
      status: "RECORDING",
      segmentCount: 0,
      durationSeconds: 0,
    });

    const shareUrl = watchShareUrl(request, video.id, video.shareSlug);

    return apiJson(
      {
        success: true,
        video: {
          id: video.id,
          title: video.title,
          status: video.status,
          visibility: video.visibility,
          shareSlug: video.shareSlug,
          shareUrl,
        },
      },
      201,
    );
  } catch {
    return serverError();
  }
}
