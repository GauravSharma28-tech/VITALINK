import { AxiosInstance } from 'axios';

export interface Notification {
    _id: string;
    cattleId: number;
    message: string;
    status: string;
    read: boolean;
    timestamp: string;
}

// Fetch all notifications (for AlertScreen page)
export const fetchAllNotifications = async (axios: AxiosInstance): Promise<Notification[]> => {
    const res = await axios.get('/api/notifications');
    return res.data;
};

// Fetch unread notifications (for dropdown)
export const fetchUnreadNotifications = async (axios: AxiosInstance): Promise<Notification[]> => {
    const res = await axios.get('/api/notifications/unread');
    return res.data;
};

// Fetch unread count only (lightweight, for badge)
export const fetchUnreadCount = async (axios: AxiosInstance): Promise<number> => {
    const res = await axios.get('/api/notifications/unread-count');
    return res.data.count;
};

// Mark a single notification as read
export const markRead = async (axios: AxiosInstance, id: string): Promise<void> => {
    await axios.post(`/api/notifications/${id}/markRead`);
};

// Mark all notifications as read
export const markAllRead = async (axios: AxiosInstance): Promise<void> => {
    await axios.post('/api/notifications/markAllRead');
};

// Delete a single notification
export const deleteNotification = async (axios: AxiosInstance, id: string): Promise<void> => {
    await axios.delete(`/api/notifications/${id}`);
};

// Delete old read notifications
export const deleteOldNotifications = async (axios: AxiosInstance, days: number = 30): Promise<{ success: boolean; deletedCount?: number }> => {
    const res = await axios.delete(`/api/notifications/old?days=${days}`);
    return res.data;
};

// Clear all notifications
export const clearAll = async (axios: AxiosInstance): Promise<void> => {
    await axios.delete('/api/notifications/clearAll');
};
