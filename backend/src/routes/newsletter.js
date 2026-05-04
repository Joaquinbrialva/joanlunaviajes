import { Router } from 'express';
import { prisma } from '../store/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/newsletter/subscribe
router.post('/subscribe', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const name  = String(req.body.name  || '').trim();

    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Email inválido.' });
    }

    const existing = await prisma.subscriber.findUnique({ where: { email } });
    if (existing) {
      if (!existing.active) {
        await prisma.subscriber.update({ where: { email }, data: { active: true, name } });
        return res.json({ message: 'Tu suscripción fue reactivada.' });
      }
      return res.json({ message: 'Ya estás suscripto.' });
    }

    await prisma.subscriber.create({ data: { email, name } });
    res.status(201).json({ message: '¡Gracias! Te suscribiste al newsletter.' });
  } catch (err) {
    console.error('[POST /newsletter/subscribe]', err);
    res.status(500).json({ error: 'No se pudo suscribir.' });
  }
});

// GET /api/newsletter/subscribers
router.get('/subscribers', requireAuth, async (req, res) => {
  try {
    const subscribers = await prisma.subscriber.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(subscribers);
  } catch {
    res.status(500).json({ error: 'No se pudieron obtener los suscriptores.' });
  }
});

// DELETE /api/newsletter/subscribers/:id
router.delete('/subscribers/:id', requireAuth, async (req, res) => {
  try {
    await prisma.subscriber.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Suscriptor no encontrado.' });
    res.status(500).json({ error: 'No se pudo eliminar.' });
  }
});

// PATCH /api/newsletter/subscribers/:id — toggle active
router.patch('/subscribers/:id', requireAuth, async (req, res) => {
  try {
    const sub = await prisma.subscriber.findUnique({ where: { id: req.params.id } });
    if (!sub) return res.status(404).json({ error: 'Suscriptor no encontrado.' });
    const updated = await prisma.subscriber.update({
      where: { id: req.params.id },
      data: { active: !sub.active },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'No se pudo actualizar.' });
  }
});

export default router;
