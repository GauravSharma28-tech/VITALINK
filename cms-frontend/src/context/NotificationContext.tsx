import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  PropsWithChildren,
} from 'react';
import { socket } from '../services/Axios';
import { fetchUnreadCount } from '../services/notificationService';
import GlobalContext from './GlobalContext';
import UseAxiosPrivate from '../hooks/UseAxiosPrivate';

export interface Notification {
  _id: string;
  cattleId: number;
  message: string;
  status: string;
  read: boolean;
  timestamp: string;
}

// Callback type for components that want real-time new notifications
type NewNotificationListener = (notification: Notification) => void;

interface NotificationContextType {
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  /** Subscribe to real-time new notifications from socket.
   *  Returns an unsubscribe function. */
  subscribeToNew: (listener: NewNotificationListener) => () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  setUnreadCount: () => { },
  subscribeToNew: () => () => { },
});

export const useNotificationBadge = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }: PropsWithChildren<{}>) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { auth } = useContext(GlobalContext);
  const axiosPrivate = UseAxiosPrivate();

  // Listeners for real-time new notifications (used by dropdown / alert screen)
  const listenersRef = useRef<Set<NewNotificationListener>>(new Set());

  const subscribeToNew = useCallback((listener: NewNotificationListener) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  useEffect(() => {
    if (!auth?.accessToken) {
      setUnreadCount(0);
      return;
    }

    // Fetch initial unread count (lightweight call)
    fetchUnreadCount(axiosPrivate)
      .then((count) => setUnreadCount(count))
      .catch((err) => console.error('Failed to fetch unread count:', err));

    // Listen for new notifications via socket
    const handleNewNotification = (notification: Notification) => {
      // Increment badge count
      setUnreadCount((prev) => prev + 1);

      // Broadcast to any subscribed components (dropdown, alert screen, etc.)
      listenersRef.current.forEach((listener) => listener(notification));
    };

    socket.on('new_notification', handleNewNotification);

    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [!!auth?.accessToken]); // only re-run on login/logout, not token refresh

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        setUnreadCount,
        subscribeToNew,
      }}>
      {children}
    </NotificationContext.Provider>
  );
};
