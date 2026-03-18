import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { readSettings, writeSettings } from '../store/settings.js';

const router = Router();
const ALLOWED_ROLES = ['admin', 'designer'];

// GET /api/settings/hero — público (lo usa el Hero en el frontend)
router.get('/hero', (_req, res) => {
  const settings = readSettings();
  res.json(settings.hero ?? { type: 'image', url: '/assets/images/hero-img.jpg', poster: null });
});

// PATCH /api/settings/hero — solo admin/designer
router.patch('/hero', requireAuth, (req, res) => {
  if (!ALLOWED_ROLES.includes(req.user.role)) {
    return res.status(403).json({ error: 'No autorizado.' });
  }
  const { type, url, poster } = req.body;
  if (!type || !url) return res.status(400).json({ error: 'type y url son requeridos.' });
  if (!['image', 'video'].includes(type)) {
    return res.status(400).json({ error: 'type debe ser "image" o "video".' });
  }

  const settings = readSettings();
  settings.hero = { type, url, poster: poster || null };
  writeSettings(settings);
  res.json(settings.hero);
});

export default router;
