import { db } from "@/db";
import { notifications } from "@/db/schema";

type NotificationType =
  | "COMMENT"
  | "VIDEO_SHARED"
  | "RECORDING_READY"
  | "MENTION";

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

  return row;
};
