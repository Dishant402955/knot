"use server";

import { db } from "@/db";
import { notifications } from "@/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Intentionally do NOT re-export createNotification — that helper must stay
// server-only (lib/notifications) so clients cannot forge notifications.

export const getAllUserNotifications = async () => {
  const user = await currentUser();

  if (!user) {
    return {
      success: false as const,
      status: 401,
      message: "Not Authenticated.",
    };
  }

  try {
    const data = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, user.id))
      .orderBy(desc(notifications.createdAt));

    return {
      success: true as const,
      status: 200,
      notifications: data,
      message: "Retrieved all notifications.",
    };
  } catch {
    return {
      success: false as const,
      status: 500,
      message: "Internal server Error.",
    };
  }
};

export const getUnreadNotificationCount = async () => {
  const user = await currentUser();

  if (!user) {
    return {
      success: false as const,
      status: 401,
      count: 0,
      message: "Not Authenticated.",
    };
  }

  try {
    const [row] = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, user.id),
          eq(notifications.isRead, false),
        ),
      );

    return {
      success: true as const,
      status: 200,
      count: row?.count ?? 0,
      message: "OK",
    };
  } catch {
    return {
      success: false as const,
      status: 500,
      count: 0,
      message: "Internal server Error.",
    };
  }
};

export const markNotificationAsRead = async (id: string) => {
  const user = await currentUser();

  if (!user) {
    return {
      success: false as const,
      status: 401,
      message: "Not Authenticated.",
    };
  }

  try {
    const [updated] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(eq(notifications.id, id), eq(notifications.userId, user.id)),
      )
      .returning();

    if (!updated) {
      return {
        success: false as const,
        status: 404,
        message: "Notification not found.",
      };
    }

    revalidatePath("/dashboard/notifications");
    revalidatePath("/dashboard");

    return {
      success: true as const,
      status: 200,
      notification: updated,
      message: "Marked as read.",
    };
  } catch {
    return {
      success: false as const,
      status: 500,
      message: "Internal server Error.",
    };
  }
};

export const markAllNotificationsAsRead = async () => {
  const user = await currentUser();

  if (!user) {
    return {
      success: false as const,
      status: 401,
      message: "Not Authenticated.",
    };
  }

  try {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.userId, user.id),
          eq(notifications.isRead, false),
        ),
      );

    revalidatePath("/dashboard/notifications");
    revalidatePath("/dashboard");

    return {
      success: true as const,
      status: 200,
      message: "All notifications marked as read.",
    };
  } catch {
    return {
      success: false as const,
      status: 500,
      message: "Internal server Error.",
    };
  }
};
