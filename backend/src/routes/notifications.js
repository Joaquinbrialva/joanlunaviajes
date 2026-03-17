import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { readAll, writeAll } from '../store/notifications.js';

const router = Router();

// GET /api/notifications  — lista para el rol del usuario actual
router.get('/', requireAuth, async (req, res) => {
  try {
    const all = await readAll();
    const { id: userId, role: userRole } = req.user;
    const filtered = all
      .filter((n) => n.forRoles.includes(userRole))
      .map((n) => ({ ...n, isRead: n.readBy.includes(userId) }))
      .slice(0, 50);
    res.json(filtered);
  } catch {
    res.status(500).json({ error: 'Error al obtener notificaciones.' });
  }
});

// POST /api/notifications/read-all
router.post('/read-all', requireAuth, async (req, res) => {
  try {
    const all = await readAll();
    const { id: userId, role: userRole } = req.user;
    const updated = all.map((n) => {
      if (n.forRoles.includes(userRole) && !n.readBy.includes(userId)) {
        return { ...n, readBy: [...n.readBy, userId] };
      }
      return n;
    });
    await writeAll(updated);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Error al marcar notificaciones.' });
  }
});

// POST /api/notifications/:id/read
router.post('/:id/read', requireAuth, async (req, res) => {
  try {
    const all = await readAll();
    const { id: userId } = req.user;
    const idx = all.findIndex((n) => n.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Notificación no encontrada.' });
    if (!all[idx].readBy.includes(userId)) {
      all[idx] = { ...all[idx], readBy: [...all[idx].readBy, userId] };
      await writeAll(all);
    }
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Error al marcar notificación.' });
  }
});

export default router;
