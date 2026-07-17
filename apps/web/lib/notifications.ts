import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { notifications } from "@/db/schema";

type NotificationType =
  | "COMMENT"
  | "VIDEO_SHARED"
  | "RECORDING_READY"
  | "MENTION";

type VideoVisibility = "PRIVATE" | "PUBLIC" | "AUTHENTICATED";

/** Internal helper — create a notification for a user (not a client action). */
export const createNotification = async ({
  userId,
  type,
  entityId,
}: {
  userId: string;
  type: NotificationType;
  entityId?: string | null;
}) => {
  const [row] = await db
    .insert(notifications)
    .values({
      userId,
      type,
      entityId: entityId ?? null,
      isRead: false,
    })
    .returning();

  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard");

  return row;
};

/**
 * Notify the owner when a video first becomes Public (shareable externally).
 * Skips AUTHENTICATED — that is not a public share.
 */
export const notifyIfVideoBecamePublic = async (
  ownerId: string,
  videoId: string,
  previous: VideoVisibility,
  next: VideoVisibility,
) => {
  if (previous === "PUBLIC" || next !== "PUBLIC") return null;

  const row = await createNotification({
    userId: ownerId,
    type: "VIDEO_SHARED",
    entityId: videoId,
  });

  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard");

  return row;
};
