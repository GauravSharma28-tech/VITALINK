import { useEffect, useState, useRef } from "react";
import dayjs from "dayjs";
import { MdDeleteOutline, MdDeleteSweep } from "react-icons/md";
import { useNotificationBadge, Notification } from "../context/NotificationContext";
import * as notificationService from "../services/notificationService";
import UseAxiosPrivate from "../hooks/UseAxiosPrivate";

const AlertScreen = () => {
  const { setUnreadCount, subscribeToNew } = useNotificationBadge();
  const axiosPrivate = UseAxiosPrivate();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDeleteOldConfirm, setShowDeleteOldConfirm] = useState(false);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [deleteOldDays, setDeleteOldDays] = useState(30);
  const rowRefs = useRef<{ [key: string]: HTMLTableRowElement | null }>({});

  // Fetch all notifications on mount
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    notificationService
      .fetchAllNotifications(axiosPrivate)
      .then((data) => {
        if (!cancelled) setNotifications(data);
      })
      .catch((err) => console.error("Failed to fetch notifications:", err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // Subscribe to real-time new notifications via socket
    const unsubscribe = subscribeToNew((notification) => {
      setNotifications((prev) => {
        if (prev.some((n) => n._id === notification._id)) return prev;
        return [notification, ...prev];
      });
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [subscribeToNew]);

  // Scroll to selected notification
  useEffect(() => {
    if (selectedId && rowRefs.current[selectedId]) {
      rowRefs.current[selectedId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [selectedId, notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

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

  const handleDeleteOld = async () => {
    try {
      const result = await notificationService.deleteOldNotifications(axiosPrivate, deleteOldDays);
      if (result.success) {
        const data = await notificationService.fetchAllNotifications(axiosPrivate);
        setNotifications(data);
        const count = await notificationService.fetchUnreadCount(axiosPrivate);
        setUnreadCount(count);
      }
      setShowDeleteOldConfirm(false);
    } catch (err) {
      console.error("Failed to delete old notifications:", err);
    }
  };

  const handleClearAll = async () => {
    try {
      await notificationService.clearAll(axiosPrivate);
      setNotifications([]);
      setUnreadCount(0);
      setShowClearAllConfirm(false);
    } catch (err) {
      console.error("Failed to clear all:", err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "DANGER":
        return "bg-red-100 text-red-800";
      case "WARNING":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="mt-10 px-5 text-center text-gray-500">
        Loading notifications...
      </div>
    );
  }

  return (
    <div className="mt-10 overflow-x-auto px-5">
      <div className="flex items-start justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Notifications</h2>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
              {unreadCount} unread
            </span>
          )}
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              Mark all read
            </button>
          )}
          <button
            onClick={() => setShowDeleteOldConfirm(true)}
            className="flex items-center gap-1 text-sm bg-orange-50 text-orange-700 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <MdDeleteSweep size={18} />
            Delete old
          </button>
          <button
            onClick={() => setShowClearAllConfirm(true)}
            className="flex items-center gap-1 text-sm bg-red-50 text-red-700 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <MdDeleteOutline size={18} />
            Clear all
          </button>
        </div>
      </div>
      <hr className="text-gray-300 w-full mb-4" />

      {/* Delete old notifications confirmation */}
      {showDeleteOldConfirm && (
        <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-orange-700">
              Delete read notifications older than
            </span>
            <select
              value={deleteOldDays}
              onChange={(e) => setDeleteOldDays(Number(e.target.value))}
              className="border border-orange-300 rounded px-2 py-1 text-sm"
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDeleteOldConfirm(false)}
              className="px-3 py-1 text-sm text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteOld}
              className="px-3 py-1 text-sm text-white bg-orange-600 rounded hover:bg-orange-700"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Clear all confirmation */}
      {showClearAllConfirm && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <span className="text-sm text-red-700">
            Are you sure you want to delete ALL notifications? This cannot be
            undone.
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setShowClearAllConfirm(false)}
              className="px-3 py-1 text-sm text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleClearAll}
              className="px-3 py-1 text-sm text-white bg-red-600 rounded hover:bg-red-700"
            >
              Delete All
            </button>
          </div>
        </div>
      )}

      {/* Table to display the alert notifications */}
      <table className="w-full divide-y divide-gray-200 rounded-lg overflow-hidden shadow-md">
        <thead className="text-gray-800 bg-white">
          <tr>
            {[
              "cattle id",
              "message",
              "status",
              "read status",
              "timestamp",
              "actions",
            ].map((heading) => (
              <th
                key={heading}
                className="py-4 text-center text-sm font-medium uppercase tracking-wider"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-100">
          {notifications.length > 0 ? (
            notifications.map((n) => {
              return (
                <tr
                  key={n._id}
                  ref={(el) => (rowRefs.current[n._id] = el)}
                  onClick={() => {
                    if (!n.read) {
                      handleMarkRead(n._id);
                    }
                    setSelectedId(n._id);
                  }}
                  className={`cursor-pointer transition-colors ${selectedId === n._id
                    ? "bg-green-50 hover:bg-green-100"
                    : n.read
                      ? "hover:bg-gray-50"
                      : "bg-gray-50 hover:bg-gray-100"
                    }`}
                >
                  <td className="py-3 text-center text-sm font-medium text-gray-900">
                    {n.cattleId}
                  </td>

                  <td className="py-3 text-center text-sm text-gray-900 px-4">
                    <div className="max-w-xs truncate" title={n.message}>
                      {n.message}
                    </div>
                  </td>

                  <td className="py-3 text-center">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        n.status
                      )}`}
                    >
                      {n.status?.charAt(0).toUpperCase() +
                        n.status?.slice(1).toLowerCase()}
                    </span>
                  </td>

                  <td className="py-3 text-center">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${n.read
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800"
                        }`}
                    >
                      {n.read ? "Read" : "Unread"}
                    </span>
                  </td>

                  <td className="py-3 text-center text-sm text-gray-500">
                    {dayjs(n.timestamp).format("MMM D, YYYY h:mm A")}
                  </td>

                  <td className="py-3 text-center">
                    <div className="flex justify-center items-center gap-2">
                      {!n.read && (
                        <button
                          className="text-xs text-blue-600 hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkRead(n._id);
                          }}
                        >
                          Mark Read
                        </button>
                      )}
                      <button
                        className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                        title="Delete notification"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(n._id);
                        }}
                      >
                        <MdDeleteOutline size={18} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td
                colSpan={6}
                className="px-6 py-8 text-center text-sm text-gray-500"
              >
                No notifications available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AlertScreen;