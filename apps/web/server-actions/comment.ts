"use server";

import { db } from "@/db";
import { comments, notifications, videos } from "@/db/schema";
import { auth, currentUser } from "@clerk/nextjs/server";
import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const MAX_COMMENT_LENGTH = 2000;

const canAccessVideoForComments = async (videoId: string) => {
  const [video] = await db
    .select({
      id: videos.id,
      userId: videos.userId,
      visibility: videos.visibility,
      title: videos.title,
    })
    .from(videos)
    .where(eq(videos.id, videoId))
    .limit(1);

  if (!video) {
    return { ok: false as const, status: 404 as const, message: "Video not found." };
  }

  const { userId: authUserId } = await auth();
  const isOwner = authUserId === video.userId;

  if (video.visibility === "PRIVATE" && !isOwner) {
    return { ok: false as const, status: 404 as const, message: "Video not found." };
  }

  if (video.visibility === "AUTHENTICATED" && !authUserId) {
    return {
      ok: false as const,
      status: 401 as const,
      message: "Sign in required.",
    };
  }

  return { ok: true as const, video, authUserId, isOwner };
};

export type WatchComment = {
  id: string;
  videoId: string;
  userId: string;
  text: string;
  timestampSeconds: number | null;
  createdAt: Date;
  updatedAt: Date;
  isOwn: boolean;
};

export const getCommentsForVideo = async (videoId: string) => {
  try {
    const access = await canAccessVideoForComments(videoId);
    if (!access.ok) {
      return {
        success: false as const,
        status: access.status,
        message: access.message,
      };
    }

    const rows = await db
      .select()
      .from(comments)
      .where(eq(comments.videoId, videoId))
      .orderBy(asc(comments.createdAt));

    const data: WatchComment[] = rows.map((row) => ({
      id: row.id,
      videoId: row.videoId,
      userId: row.userId,
      text: row.text,
      timestampSeconds: row.timestampSeconds,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      isOwn: access.authUserId === row.userId,
    }));

    return {
      success: true as const,
      status: 200,
      comments: data,
      canComment: Boolean(access.authUserId),
      currentUserId: access.authUserId ?? null,
      message: "OK",
    };
  } catch {
    return {
      success: false as const,
      status: 500,
      message: "Internal server Error.",
    };
  }
};

export const createComment = async ({
  videoId,
  text,
  timestampSeconds,
}: {
  videoId: string;
  text: string;
  timestampSeconds?: number | null;
}) => {
  const user = await currentUser();

  if (!user) {
    return {
      success: false as const,
      status: 401,
      message: "Not Authenticated.",
    };
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return {
      success: false as const,
      status: 400,
      message: "Comment cannot be empty.",
    };
  }

  if (trimmed.length > MAX_COMMENT_LENGTH) {
    return {
      success: false as const,
      status: 400,
      message: `Comment must be ${MAX_COMMENT_LENGTH} characters or fewer.`,
    };
  }

  const stamp =
    timestampSeconds === undefined || timestampSeconds === null
      ? null
      : Math.max(0, Math.floor(timestampSeconds));

  try {
    const access = await canAccessVideoForComments(videoId);
    if (!access.ok) {
      return {
        success: false as const,
        status: access.status,
        message: access.message,
      };
    }

    if (!access.authUserId) {
      return {
        success: false as const,
        status: 401,
        message: "Sign in required.",
      };
    }

    const [comment] = await db
      .insert(comments)
      .values({
        videoId,
        userId: user.id,
        text: trimmed,
        timestampSeconds: stamp,
      })
      .returning();

    // Notify video owner when someone else comments.
    if (access.video.userId !== user.id) {
      await db.insert(notifications).values({
        userId: access.video.userId,
        type: "COMMENT",
        entityId: videoId,
        isRead: false,
      });
    }

    revalidatePath(`/watch/${videoId}`);
    revalidatePath("/dashboard/notifications");

    return {
      success: true as const,
      status: 201,
      comment: {
        id: comment.id,
        videoId: comment.videoId,
        userId: comment.userId,
        text: comment.text,
        timestampSeconds: comment.timestampSeconds,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        isOwn: true,
      } satisfies WatchComment,
      message: "Comment posted.",
    };
  } catch {
    return {
      success: false as const,
      status: 500,
      message: "Internal server Error.",
    };
  }
};

export const deleteComment = async ({
  commentId,
}: {
  commentId: string;
}) => {
  const user = await currentUser();

  if (!user) {
    return {
      success: false as const,
      status: 401,
      message: "Not Authenticated.",
    };
  }

  try {
    const [existing] = await db
      .select({
        id: comments.id,
        videoId: comments.videoId,
        userId: comments.userId,
      })
      .from(comments)
      .where(eq(comments.id, commentId))
      .limit(1);

    if (!existing) {
      return {
        success: false as const,
        status: 404,
        message: "Comment not found.",
      };
    }

    const [video] = await db
      .select({ userId: videos.userId })
      .from(videos)
      .where(eq(videos.id, existing.videoId))
      .limit(1);

    const isOwner = video?.userId === user.id;
    const isAuthor = existing.userId === user.id;

    if (!isOwner && !isAuthor) {
      return {
        success: false as const,
        status: 403,
        message: "Not allowed to delete this comment.",
      };
    }

    await db.delete(comments).where(eq(comments.id, commentId));

    revalidatePath(`/watch/${existing.videoId}`);

    return {
      success: true as const,
      status: 200,
      message: "Comment deleted.",
    };
  } catch {
    return {
      success: false as const,
      status: 500,
      message: "Internal server Error.",
    };
  }
};
