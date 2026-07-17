"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/server-actions/notification";

import { Bell, CheckCheck } from "lucide-react";

type NotificationItem = {
  id: string;
  type: string;
  entityId: string | null;
  isRead: boolean;
  createdAt: Date | string;
};

const notificationLabels: Record<string, string> = {
  COMMENT: "New comment on your video",
  VIDEO_SHARED: "Your video is now public",
  RECORDING_READY: "Recording is ready",
  MENTION: "You were mentioned",
};

const entityHref = (notification: NotificationItem) => {
  if (!notification.entityId) return null;
  if (
    notification.type === "COMMENT" ||
    notification.type === "RECORDING_READY" ||
    notification.type === "VIDEO_SHARED" ||
    notification.type === "MENTION"
  ) {
    return `/watch/${notification.entityId}`;
  }
  return null;
};

const NotificationsList = ({
  notifications: initial,
}: {
  notifications: NotificationItem[];
}) => {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setItems(initial);
  }, [initial]);

  const unreadCount = items.filter((n) => !n.isRead).length;

  const markOne = (id: string) => {
    const previous = items;
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    startTransition(async () => {
      const res = await markNotificationAsRead(id);
      if (!res.success) {
        setItems(previous);
        toast.error(res.message);
        router.refresh();
        return;
      }
      router.refresh();
    });
  };

  const markAll = () => {
    const previous = items;
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    startTransition(async () => {
      const res = await markAllNotificationsAsRead();
      if (!res.success) {
        setItems(previous);
        toast.error(res.message);
        router.refresh();
        return;
      }
      toast.success(res.message);
      router.refresh();
    });
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Bell className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">No notifications yet</p>
          <p className="text-sm text-muted-foreground">
            You&apos;ll see comments and recording updates here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {unreadCount > 0
            ? `${unreadCount} unread`
            : "You're all caught up"}
        </p>

        {unreadCount > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="cursor-pointer"
            disabled={pending}
            onClick={markAll}
            data-knot="mark-all-read"
          >
            <CheckCheck className="mr-1.5 h-4 w-4" />
            Mark all read
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        {items.map((notification) => {
          const href = entityHref(notification);
          const label =
            notificationLabels[notification.type] ?? notification.type;

          const body = (
            <>
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 shrink-0 text-muted-foreground" />

                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(notification.createdAt), "PPp")}
                  </p>
                </div>
              </div>

              {!notification.isRead ? (
                <span className="size-2 shrink-0 rounded-full bg-primary" />
              ) : (
                <span className="size-2 shrink-0" />
              )}
            </>
          );

          const className = `flex w-full items-center justify-between gap-4 rounded-lg border px-4 py-3 text-left transition hover:bg-muted/50 ${
            !notification.isRead ? "border-primary/30 bg-muted/30" : ""
          }`;

          if (href) {
            return (
              <Link
                key={notification.id}
                href={href}
                className={className}
                onClick={() => {
                  if (!notification.isRead) markOne(notification.id);
                }}
              >
                {body}
              </Link>
            );
          }

          return (
            <button
              key={notification.id}
              type="button"
              className={`${className} cursor-pointer`}
              onClick={() => {
                if (!notification.isRead) markOne(notification.id);
              }}
            >
              {body}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export { NotificationsList };
