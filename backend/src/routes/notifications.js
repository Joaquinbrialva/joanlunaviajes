import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../store/prisma.js';

const router = Router();

// GET /api/notifications  — lista para el rol del usuario actual
router.get('/', requireAuth, async (req, res) => {
  try {
    const { id: userId, role: userRole } = req.user;
    const notifications = await prisma.notification.findMany({
      where: { forRoles: { has: userRole } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const result = notifications.map((n) => ({ ...n, isRead: n.readBy.includes(userId) }));
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Error al obtener notificaciones.' });
  }
});

// POST /api/notifications/read-all
router.post('/read-all', requireAuth, async (req, res) => {
  try {
    const { id: userId, role: userRole } = req.user;
    const notifications = await prisma.notification.findMany({
      where: { forRoles: { has: userRole }, NOT: { readBy: { has: userId } } },
    });
    await Promise.all(
      notifications.map((n) =>
        prisma.notification.update({
          where: { id: n.id },
          data: { readBy: { push: userId } },
        })
      )
    );
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Error al marcar notificaciones.' });
  }
});

// POST /api/notifications/:id/read
router.post('/:id/read', requireAuth, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!notification) return res.status(404).json({ error: 'Notificación no encontrada.' });
    if (!notification.readBy.includes(userId)) {
      await prisma.notification.update({
        where: { id: req.params.id },
        data: { readBy: { push: userId } },
      });
    }
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Error al marcar notificación.' });
  }
});

// DELETE /api/notifications/read — elimina todas las leídas por el usuario (debe ir antes de /:id)
router.delete('/read', requireAuth, async (req, res) => {
  try {
    const { id: userId, role: userRole } = req.user;
    // Solo elimina notificaciones dirigidas a este rol Y ya leídas por este usuario
    const toDelete = await prisma.notification.findMany({
      where: { forRoles: { has: userRole }, readBy: { has: userId } },
      select: { id: true },
    });
    await prisma.notification.deleteMany({
      where: { id: { in: toDelete.map((n) => n.id) } },
    });
    res.json({ deleted: toDelete.length });
  } catch {
    res.status(500).json({ error: 'Error al eliminar notificaciones.' });
  }
});

// DELETE /api/notifications/:id — elimina una notificación individual
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { role: userRole } = req.user;
    const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!notification) return res.status(404).json({ error: 'Notificación no encontrada.' });
    if (!notification.forRoles.includes(userRole)) return res.status(403).json({ error: 'Sin permiso.' });
    await prisma.notification.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Error al eliminar notificación.' });
  }
});

export default router;
