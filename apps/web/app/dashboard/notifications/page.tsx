import { format } from "date-fns";

import { getAllUserNotifications } from "@/server-actions/notification";

import { Bell } from "lucide-react";

const notificationLabels: Record<string, string> = {
  COMMENT: "New comment on your video",
  VIDEO_SHARED: "Your video was shared",
  RECORDING_READY: "Recording is ready",
  MENTION: "You were mentioned",
};

const NotificationsPage = async () => {
  const { success, notifications, message } = await getAllUserNotifications();

  if (!success || !notifications) {
    return <>{message}</>;
  }

  return (
    <div className="px-15 pb-15 pt-10 space-y-6">
      <p className="font-bold text-2xl">Notifications</p>

      {notifications.length > 0 ? (
        <div className="flex flex-col gap-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 shrink-0 text-muted-foreground" />

                <div>
                  <p className="text-sm font-medium">
                    {notificationLabels[notification.type] ?? notification.type}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {format(new Date(notification.createdAt), "PPp")}
                  </p>
                </div>
              </div>

              {!notification.isRead && (
                <span className="size-2 shrink-0 rounded-full bg-primary" />
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No notifications yet.</p>
      )}
    </div>
  );
};

export default NotificationsPage;
