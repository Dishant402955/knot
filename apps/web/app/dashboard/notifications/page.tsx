import { NotificationsList } from "@/app/dashboard/_components/notifications-list";
import { getAllUserNotifications } from "@/server-actions/notification";

const NotificationsPage = async () => {
  const { success, notifications, message } = await getAllUserNotifications();

  if (!success || !notifications) {
    return <>{message}</>;
  }

  return (
    <div className="px-15 pb-15 pt-10 space-y-6">
      <p className="font-bold text-2xl">Notifications</p>

      <NotificationsList notifications={notifications} />
    </div>
  );
};

export default NotificationsPage;
