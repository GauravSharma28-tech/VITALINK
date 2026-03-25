import { useState, useEffect } from "react";
import { MdDeleteOutline } from "react-icons/md";
import { useNotificationBadge, Notification } from "../context/NotificationContext";
import * as notificationService from "../services/notificationService";
import UseAxiosPrivate from "../hooks/UseAxiosPrivate";

const NotificationDropDown = ({
  onNotificationClick,
}: {
  onNotificationClick?: (n: Notification) => void;
}) => {
  const { setUnreadCount, subscribeToNew } = useNotificationBadge();
  const axiosPrivate = UseAxiosPrivate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch unread notifications when dropdown opens
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    notificationService
      .fetchUnreadNotifications(axiosPrivate)
      .then((data) => {
        if (!cancelled) setNotifications(data.slice(0, 20));
      })
      .catch((err) => console.error("Failed to fetch notifications:", err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // Subscribe to real-time new notifications via socket
    const unsubscribe = subscribeToNew((notification) => {
      setNotifications((prev) => {
        if (prev.some((n) => n._id === notification._id)) return prev;
        return [notification, ...prev].slice(0, 20);
      });
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [subscribeToNew]);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationService.markRead(axiosPrivate, id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead(axiosPrivate);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const wasUnread = notifications.find((n) => n._id === id && !n.read);
      await notificationService.deleteNotification(axiosPrivate, id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  return (
    <div className="fixed right-10 top-20 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
      <div className="flex justify-between items-center px-4 py-2 border-b">
        <span className="font-bold">Notifications</span>
        <div className="flex gap-2">
          <button className="text-xs text-blue-600 hover:underline" onClick={handleMarkAllRead}>
            Mark all read
          </button>
        </div>
      </div>
      {loading ? (
        <div className="p-4 text-gray-500 text-center">Loading...</div>
      ) : notifications.length === 0 ? (
        <div className="p-4 text-gray-500 text-center">No notifications</div>
      ) : (
        notifications.map((n) => (
          <div
            key={n._id}
            className={`px-4 py-2 border-b cursor-pointer hover:bg-gray-50 ${n.read ? "bg-white" : "bg-gray-200"
              }`}
            onClick={() => {
              if (!n.read) handleMarkRead(n._id);
              if (onNotificationClick) onNotificationClick(n);
            }}
          >
            <div className="flex justify-between items-center">
              <span className="font-semibold text-sm">Cattle {n.cattleId}</span>
              <div className="flex items-center gap-1">
                <span
                  className={`text-xs ${n.status === "DANGER" ? "text-red-500" : n.status === "WARNING" ? "text-yellow-600" : "text-gray-500"
                    }`}
                >
                  {n.status}
                </span>
                <button
                  className="text-gray-400 hover:text-red-500 p-0.5"
                  title="Delete notification"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(n._id);
                  }}
                >
                  <MdDeleteOutline size={16} />
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-700">{n.message}</div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-400">
                {new Date(n.timestamp).toLocaleDateString()}{" "}
                {new Date(n.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              {!n.read && (
                <button
                  className="text-xs text-blue-500 hover:underline ml-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkRead(n._id);
                  }}
                >
                  Mark Read
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default NotificationDropDown;
