import Notification from '../model/notificationModel';
import { Request, Response } from 'express';

// Get all notifications
export const getNotifications = async (req: Request, res: Response) => {
  const notifications = await Notification.find({}).sort({ timestamp: -1 });
  res.json(notifications);
};

// Get All unread notification
export const getUnReadNotifications = async (req: Request, res: Response) => {
  const notifications = await Notification.find({ read: false }).sort({ timestamp: -1 });
  res.json(notifications);
};

// Get unread notification count only (lightweight for badge)
export const getUnreadCount = async (req: Request, res: Response) => {
  const count = await Notification.countDocuments({ read: false });
  res.json({ count });
};

// Mark all notifications as read
export const markAllRead = async (req: Request, res: Response) => {
  await Notification.updateMany({ read: false }, { $set: { read: true } });
  res.json({ success: true });
};

// Clear all notifications
export const clearAll = async (req: Request, res: Response) => {
  await Notification.deleteMany({});
  res.json({ success: true });
};

// Mark single notification as read
export const markRead = async (req: Request, res: Response) => {
  const { id } = req.params;
  await Notification.findByIdAndUpdate(id, { $set: { read: true } });
  res.json({ success: true });
};

// Delete a notification
export const deleteNotification = async (req: Request, res: Response) => {
  const { id } = req.params;
  await Notification.findByIdAndDelete(id);
  res.json({ success: true });
};

// Delete old read notifications (older than given days, default 30)
export const deleteOldNotifications = async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const result = await Notification.deleteMany({
      read: true,
      timestamp: { $lt: cutoffDate },
    });
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err) {
    console.error('Failed to delete old notifications:', err);
    res.status(500).json({ success: false, message: 'Failed to delete old notifications' });
  }
};