import { Router } from 'express';
import { prisma, withRetry } from '../store/prisma.js';
import { optionalAuth, requireRole } from '../middleware/auth.js';

function normalizeList(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return String(value || '').split('\n').map((s) => s.trim()).filter(Boolean);
}

function normalizeMedia(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item.url === 'string' && item.url.trim())
    .map((item) => {
      const type = item.type === 'video' ? 'video' : 'image';
      const out = { url: item.url.trim(), type };
      if (type === 'video') {
        const start = Number(item.trimStart);
        const end = Number(item.trimEnd);
        if (Number.isFinite(start) && start >= 0) out.trimStart = start;
        if (Number.isFinite(end) && end > 0) out.trimEnd = end;
        const zoom = Number(item.zoom);
        if (Number.isFinite(zoom) && zoom > 1) out.zoom = zoom;
        const fx = Number(item.focalPoint?.x);
        const fy = Number(item.focalPoint?.y);
        if (Number.isFinite(fx) && Number.isFinite(fy)) out.focalPoint = { x: fx, y: fy };
      }
      return out;
    });
}

const router = Router();

const STAFF_ROLES = ['admin', 'agent', 'designer'];

// GET /api/novedades — público ve solo publicadas, staff ve todas
router.get('/', optionalAuth, async (req, res) => {
  try {
    const isStaff = STAFF_ROLES.includes(req.user?.role);
    const updates = await prisma.update.findMany({
      where: isStaff ? undefined : { status: 'published' },
      orderBy: { createdAt: 'desc' },
    });
    res.json(updates);
  } catch (err) {
    console.error('[GET /api/novedades]', err);
    res.status(500).json({ error: 'No se pudieron obtener las novedades.' });
  }
});

// POST /api/novedades  (admin, agent, designer)
router.post('/', ...requireRole('admin', 'agent', 'designer'), async (req, res) => {
  try {
    const media = req.body.media !== undefined
      ? normalizeMedia(req.body.media)
      : normalizeList(req.body.images).map((url) => ({ url, type: 'image' }));
    if (media.length === 0) {
      return res.status(400).json({ error: 'Agregá al menos una imagen o video.' });
    }

    const data = {
      images: media.map((item) => item.url),
      media,
      caption: String(req.body.caption || '').trim(),
      status: req.body.status === 'draft' ? 'draft' : 'published',
    };

    const created = await withRetry(() => prisma.update.create({ data }));
    res.status(201).json(created);
  } catch (err) {
    console.error('[POST /api/novedades]', err);
    res.status(500).json({ error: 'No se pudo guardar la novedad.' });
  }
});

// PATCH /api/novedades/:id  (admin, agent, designer)
router.patch('/:id', ...requireRole('admin', 'agent', 'designer'), async (req, res) => {
  try {
    const existing = await prisma.update.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Novedad no encontrada.' });

    const media = req.body.media !== undefined
      ? normalizeMedia(req.body.media)
      : req.body.images !== undefined
        ? normalizeList(req.body.images).map((url) => ({ url, type: 'image' }))
        : (Array.isArray(existing.media) && existing.media.length > 0
          ? existing.media
          : existing.images.map((url) => ({ url, type: 'image' })));
    if (media.length === 0) {
      return res.status(400).json({ error: 'Agregá al menos una imagen o video.' });
    }

    const updateData = {
      images: media.map((item) => item.url),
      media,
      caption: req.body.caption !== undefined ? String(req.body.caption).trim() : existing.caption,
      status: req.body.status !== undefined
        ? (req.body.status === 'draft' ? 'draft' : 'published')
        : existing.status,
    };

    const updated = await withRetry(() => prisma.update.update({ where: { id: req.params.id }, data: updateData }));
    res.json(updated);
  } catch (err) {
    console.error('[PATCH /api/novedades]', err);
    res.status(500).json({ error: 'No se pudo actualizar la novedad.' });
  }
});

// DELETE /api/novedades/:id  (admin, agent, designer)
router.delete('/:id', ...requireRole('admin', 'agent', 'designer'), async (req, res) => {
  try {
    await withRetry(() => prisma.update.delete({ where: { id: req.params.id } }));
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Novedad no encontrada.' });
    console.error('[DELETE /api/novedades]', err);
    res.status(500).json({ error: 'No se pudo eliminar la novedad.' });
  }
});

export default router;
