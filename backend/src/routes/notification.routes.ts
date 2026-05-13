import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import prisma from '../config/prisma';

const router = Router();
router.use(authenticate);

// GET /api/notifications — lấy tất cả notification của user hiện tại
router.get('/', async (req, res, next) => {
  try {
    // @ts-ignore
    const userId = req.user.user_id;
    const notifications = await prisma.notification.findMany({
      where: { user_id: Number(userId) },
      orderBy: { created_at: 'desc' },
      take: 20,
    });
    const unreadCount = notifications.filter(n => !n.is_read).length;
    // Serialize BigInt notification_id to string
    const data = notifications.map(n => ({
      ...n,
      notification_id: n.notification_id.toString(),
    }));
    res.json({ success: true, data, unreadCount });
  } catch (err) {
    next(err);
  }
});

// PUT /api/notifications/read-all — đánh dấu tất cả đã đọc
router.put('/read-all', async (req, res, next) => {
  try {
    // @ts-ignore
    const userId = req.user.user_id;
    await prisma.notification.updateMany({
      where: { user_id: Number(userId), is_read: false },
      data: { is_read: true },
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// PUT /api/notifications/:id/read — đánh dấu 1 notification đã đọc
router.put('/:id/read', async (req, res, next) => {
  try {
    // @ts-ignore
    const userId = req.user.user_id;
    const notifId = BigInt(req.params.id);
    await prisma.notification.update({
      where: { notification_id: notifId },
      data: { is_read: true },
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
