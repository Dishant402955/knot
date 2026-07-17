"use server";

import { cache } from "react";
import { db } from "@/db";
import { folders, videoSegments, videos } from "@/db/schema";
import { getSignedDownloadUrl, isB2Configured } from "@/lib/b2";
import { notifyIfVideoBecamePublic } from "@/lib/notifications";
import { withThumbnailUrls } from "@/lib/thumbnails";
import { insertVideoWithSlug } from "@/lib/video-insert";
import { auth, currentUser } from "@clerk/nextjs/server";
import { and, asc, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type VideoVisibility = "PRIVATE" | "PUBLIC" | "AUTHENTICATED";

const revalidateVideoPaths = (folderId?: string | null) => {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/videos");

  if (folderId) {
    revalidatePath(`/dashboard/folder/${folderId}`);
  }
};

const assertOwnedFolder = async (userId: string, folderId: string | null) => {
  if (!folderId) return { ok: true as const };

  const [folder] = await db
    .select({ id: folders.id })
    .from(folders)
    .where(and(eq(folders.id, folderId), eq(folders.userId, userId)))
    .limit(1);

  if (!folder) {
    return { ok: false as const, message: "Folder not found." };
  }

  return { ok: true as const };
};

export const getAllUserVideos = async () => {
  const user = await currentUser();

  if (!user) {
    return {
      success: false,
      status: 401,
      message: "Not Authenticated.",
    };
  }

  try {
    const data = await db
      .select()
      .from(videos)
      .where(eq(videos.userId, user.id))
      .orderBy(desc(videos.createdAt));

    const withThumbs = await withThumbnailUrls(data);

    return {
      success: true,
      status: 200,
      videos: withThumbs,
      message: "Retrieved all the videos.",
    };
  } catch {
    return {
      success: false,
      status: 500,
      message: "Internal server Error.",
    };
  }
};

export const getUserVideoById = async (id: string) => {
  const user = await currentUser();

  if (!user) {
    return {
      success: false,
      status: 401,
      message: "Not Authenticated.",
    };
  }

  try {
    const [video] = await db
      .select()
      .from(videos)
      .where(and(eq(videos.id, id), eq(videos.userId, user.id)))
      .limit(1);

    if (!video) {
      return {
        success: false,
        status: 404,
        message: "Video not found.",
      };
    }

    return {
      success: true,
      status: 200,
      video,
      message: "Retrieved video.",
    };
  } catch {
    return {
      success: false,
      status: 500,
      message: "Internal server Error.",
    };
  }
};

export const createVideo = async ({
  title,
  description,
  visibility = "PRIVATE",
  folderId,
}: {
  title: string;
  description?: string;
  visibility?: VideoVisibility;
  folderId?: string | null;
}) => {
  const user = await currentUser();

  if (!user) {
    return {
      success: false,
      status: 401,
      message: "Not Authenticated.",
    };
  }

  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    return {
      success: false,
      status: 400,
      message: "Title is required.",
    };
  }

  try {
    const nextFolderId = folderId ?? null;
    const folderCheck = await assertOwnedFolder(user.id, nextFolderId);
    if (!folderCheck.ok) {
      return {
        success: false,
        status: 404,
        message: folderCheck.message,
      };
    }

    const video = await insertVideoWithSlug({
      userId: user.id,
      title: trimmedTitle,
      description: description?.trim() || null,
      visibility,
      folderId: nextFolderId,
      status: "READY",
      segmentCount: 0,
      durationSeconds: 0,
    });

    revalidateVideoPaths(nextFolderId);

    return {
      success: true,
      status: 201,
      video,
      message: "Video created.",
    };
  } catch {
    return {
      success: false,
      status: 500,
      message: "Internal server Error.",
    };
  }
};

export const updateVideo = async ({
  id,
  title,
  description,
  visibility,
  folderId,
}: {
  id: string;
  title?: string;
  description?: string | null;
  visibility?: VideoVisibility;
  folderId?: string | null;
}) => {
  const user = await currentUser();

  if (!user) {
    return {
      success: false,
      status: 401,
      message: "Not Authenticated.",
    };
  }

  try {
    const [existing] = await db
      .select()
      .from(videos)
      .where(and(eq(videos.id, id), eq(videos.userId, user.id)))
      .limit(1);

    if (!existing) {
      return {
        success: false,
        status: 404,
        message: "Video not found.",
      };
    }

    const nextFolderId =
      folderId === undefined ? existing.folderId : folderId;

    if (folderId !== undefined) {
      const folderCheck = await assertOwnedFolder(user.id, folderId);
      if (!folderCheck.ok) {
        return {
          success: false,
          status: 404,
          message: folderCheck.message,
        };
      }
    }

    const nextTitle =
      title !== undefined ? title.trim() : existing.title;
    if (!nextTitle) {
      return {
        success: false,
        status: 400,
        message: "Title is required.",
      };
    }

    const [video] = await db
      .update(videos)
      .set({
        title: nextTitle,
        description:
          description === undefined
            ? existing.description
            : description?.trim() || null,
        visibility: visibility ?? existing.visibility,
        folderId: nextFolderId,
        updatedAt: new Date(),
      })
      .where(and(eq(videos.id, id), eq(videos.userId, user.id)))
      .returning();

    try {
      await notifyIfVideoBecamePublic(
        user.id,
        video.id,
        existing.visibility,
        video.visibility,
      );
    } catch {
      // Visibility update succeeded; notification is best-effort.
    }

    revalidateVideoPaths(existing.folderId);
    revalidateVideoPaths(nextFolderId);
    revalidatePath(`/watch/${id}`);

    return {
      success: true,
      status: 200,
      video,
      message: "Video updated.",
    };
  } catch {
    return {
      success: false,
      status: 500,
      message: "Internal server Error.",
    };
  }
};

export const deleteVideo = async ({ id }: { id: string }) => {
  const user = await currentUser();

  if (!user) {
    return {
      success: false,
      status: 401,
      message: "Not Authenticated.",
    };
  }

  try {
    const [existing] = await db
      .select()
      .from(videos)
      .where(and(eq(videos.id, id), eq(videos.userId, user.id)))
      .limit(1);

    if (!existing) {
      return {
        success: false,
        status: 404,
        message: "Video not found.",
      };
    }

    await db
      .delete(videos)
      .where(and(eq(videos.id, id), eq(videos.userId, user.id)));

    revalidateVideoPaths(existing.folderId);

    return {
      success: true,
      status: 200,
      message: "Video deleted.",
      folderId: existing.folderId,
    };
  } catch {
    return {
      success: false,
      status: 500,
      message: "Internal server Error.",
    };
  }
};

export type WatchSegment = {
  index: number;
  url: string;
  durationSeconds: number;
};

/**
 * Visibility-aware watch payload. Returns 404 (not 403) when access is denied.
 * Wrapped in React.cache so generateMetadata + page share one fetch per request.
 */
export const getVideoForWatch = cache(async (videoId: string) => {
  try {
    const [video] = await db
      .select()
      .from(videos)
      .where(eq(videos.id, videoId))
      .limit(1);

    if (!video) {
      return {
        success: false as const,
        status: 404,
        message: "Video not found.",
      };
    }

    const { userId: authUserId } = await auth();
    const isOwner = authUserId === video.userId;

    if (video.visibility === "PRIVATE" && !isOwner) {
      return {
        success: false as const,
        status: 404,
        message: "Video not found.",
      };
    }

    if (video.visibility === "AUTHENTICATED" && !authUserId) {
      return {
        success: false as const,
        status: 401,
        message: "Sign in required.",
      };
    }

    const segments = await db
      .select()
      .from(videoSegments)
      .where(eq(videoSegments.videoId, videoId))
      .orderBy(asc(videoSegments.index));

    let playbackSegments: WatchSegment[] = [];
    let thumbnailUrl: string | null = null;

    if (segments.length > 0) {
      if (!isB2Configured()) {
        return {
          success: false as const,
          status: 503,
          message:
            "Playback storage is not configured. Set B2_KEY_ID, B2_APPLICATION_KEY, and B2_BUCKET.",
        };
      }

      try {
        playbackSegments = await Promise.all(
          segments.map(async (segment) => ({
            index: segment.index,
            durationSeconds: segment.durationSeconds,
            url: await getSignedDownloadUrl(segment.storageKey),
          })),
        );
      } catch {
        return {
          success: false as const,
          status: 503,
          message: "Could not sign playback URLs.",
        };
      }
    }

    if (video.thumbnailKey && isB2Configured()) {
      try {
        thumbnailUrl = await getSignedDownloadUrl(video.thumbnailKey);
      } catch {
        thumbnailUrl = null;
      }
    }

    return {
      success: true as const,
      status: 200,
      video: {
        id: video.id,
        title: video.title,
        description: video.description,
        status: video.status,
        visibility: video.visibility,
        shareSlug: video.shareSlug,
        ownerUserId: video.userId,
        durationSeconds: video.durationSeconds,
        segmentCount: video.segmentCount,
        thumbnailUrl,
        isOwner,
      },
      segments: playbackSegments,
      message: "OK",
    };
  } catch {
    return {
      success: false as const,
      status: 500,
      message: "Internal server Error.",
    };
  }
});

/**
 * Progressive-playback poll. Only signs URLs for segments the client does not
 * already have (`index >= knownSegmentCount`), avoiding full re-sign every tick.
 */
export const getWatchPlaybackState = async (
  videoId: string,
  knownSegmentCount = 0,
) => {
  try {
    const [video] = await db
      .select({
        id: videos.id,
        userId: videos.userId,
        visibility: videos.visibility,
        status: videos.status,
      })
      .from(videos)
      .where(eq(videos.id, videoId))
      .limit(1);

    if (!video) {
      return {
        success: false as const,
        status: 404,
        message: "Video not found.",
      };
    }

    const { userId: authUserId } = await auth();
    const isOwner = authUserId === video.userId;

    if (video.visibility === "PRIVATE" && !isOwner) {
      return {
        success: false as const,
        status: 404,
        message: "Video not found.",
      };
    }

    if (video.visibility === "AUTHENTICATED" && !authUserId) {
      return {
        success: false as const,
        status: 401,
        message: "Sign in required.",
      };
    }

    const segmentRows = await db
      .select({
        index: videoSegments.index,
        durationSeconds: videoSegments.durationSeconds,
        storageKey: videoSegments.storageKey,
      })
      .from(videoSegments)
      .where(eq(videoSegments.videoId, videoId))
      .orderBy(asc(videoSegments.index));

    const segmentCount = segmentRows.length;
    const known = Math.max(0, Math.floor(knownSegmentCount));

    if (segmentCount === 0) {
      return {
        success: true as const,
        status: 200,
        statusLabel: video.status,
        segmentCount: 0,
        segments: [] as WatchSegment[],
      };
    }

    if (!isB2Configured()) {
      return {
        success: false as const,
        status: 503,
        message:
          "Playback storage is not configured. Set B2_KEY_ID, B2_APPLICATION_KEY, and B2_BUCKET.",
      };
    }

    const toSign = segmentRows.filter((row) => row.index >= known);

    let playbackSegments: WatchSegment[] = [];

    if (toSign.length > 0) {
      try {
        playbackSegments = await Promise.all(
          toSign.map(async (segment) => ({
            index: segment.index,
            durationSeconds: segment.durationSeconds,
            url: await getSignedDownloadUrl(segment.storageKey),
          })),
        );
      } catch {
        return {
          success: false as const,
          status: 503,
          message: "Could not sign playback URLs.",
        };
      }
    }

    return {
      success: true as const,
      status: 200,
      statusLabel: video.status,
      segmentCount,
      segments: playbackSegments,
    };
  } catch {
    return {
      success: false as const,
      status: 500,
      message: "Internal server Error.",
    };
  }
};
