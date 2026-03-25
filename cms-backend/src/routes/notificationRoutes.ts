import express from 'express';
import {
  getNotifications,
  markAllRead,
  clearAll,
  markRead,
  deleteNotification,
  getUnReadNotifications,
  getUnreadCount,
  deleteOldNotifications,
} from '../controller/notificationController';

const router = express.Router();

router.get('/', getNotifications);
router.get('/unread', getUnReadNotifications);
router.get('/unread-count', getUnreadCount);
router.post('/markAllRead', markAllRead);
router.delete('/clearAll', clearAll);
router.post('/:id/markRead', markRead);
router.delete('/old', deleteOldNotifications);
router.delete('/:id', deleteNotification);

export default router;