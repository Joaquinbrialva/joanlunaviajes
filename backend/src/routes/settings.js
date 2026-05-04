import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { readSettings, writeSettings } from '../store/settings.js';
import { supabase } from '../store/supabase.js';

const BUCKET = 'images';

// Extrae el path dentro del bucket desde una URL pública de Supabase Storage
function storagePathFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

async function deleteFromStorage(url) {
  const filePath = storagePathFromUrl(url);
  if (!filePath) return; // URL local o externa, no tocar
  const { error } = await supabase.storage.from(BUCKET).remove([filePath]);
  if (error) console.warn('[settings] No se pudo eliminar archivo anterior:', filePath, error.message);
}

const router = Router();
const ALLOWED_ROLES = ['admin', 'agent'];

// GET /api/settings/hero — público (lo usa el Hero en el frontend)
router.get('/hero', (_req, res) => {
  const settings = readSettings();
  res.json(settings.hero ?? { type: 'image', url: '/assets/images/hero-img.jpg', poster: null });
});

// PATCH /api/settings/hero — solo admin/agent
router.patch('/hero', requireAuth, async (req, res) => {
  if (!ALLOWED_ROLES.includes(req.user.role)) {
    return res.status(403).json({ error: 'No autorizado.' });
  }
  const { type, url, poster, focalPoint } = req.body;
  if (!type || !url) return res.status(400).json({ error: 'type y url son requeridos.' });
  if (!['image', 'video'].includes(type)) {
    return res.status(400).json({ error: 'type debe ser "image" o "video".' });
  }

  try {
    const settings = readSettings();
    const old = settings.hero ?? {};

    const urlChanged = old.url && old.url !== url;
    const posterChanged = old.poster && old.poster !== (poster || null);
    await Promise.all([
      urlChanged    ? deleteFromStorage(old.url)    : Promise.resolve(),
      posterChanged ? deleteFromStorage(old.poster) : Promise.resolve(),
    ]);

    settings.hero = { type, url, poster: poster || null, focalPoint: focalPoint ?? null };
    writeSettings(settings);
    res.json(settings.hero);
  } catch (err) {
    console.error('[PATCH /api/settings/hero]', err);
    res.status(500).json({ error: 'No se pudo guardar la configuración.' });
  }
});

export default router;
