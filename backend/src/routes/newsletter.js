import { Router } from 'express';
import { prisma } from '../store/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { sendNewsletterCampaign } from '../store/mailer.js';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ─── Public subscribe ──────────────────────────────────────── */

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

/* ─── Admin: list subscribers ───────────────────────────────── */

router.get('/subscribers', requireAuth, async (req, res) => {
  try {
    const subscribers = await prisma.subscriber.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(subscribers);
  } catch {
    res.status(500).json({ error: 'No se pudieron obtener los suscriptores.' });
  }
});

/* ─── Admin: delete subscriber ──────────────────────────────── */

router.delete('/subscribers/:id', requireAuth, async (req, res) => {
  try {
    await prisma.subscriber.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Suscriptor no encontrado.' });
    res.status(500).json({ error: 'No se pudo eliminar.' });
  }
});

/* ─── Admin: toggle active ──────────────────────────────────── */

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

/* ─── Admin: list campaigns ─────────────────────────────────── */

router.get('/campaigns', requireAuth, async (req, res) => {
  try {
    const campaigns = await prisma.newsletterCampaign.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(campaigns);
  } catch {
    res.status(500).json({ error: 'No se pudieron obtener las campañas.' });
  }
});

/* ─── Admin: send campaign ──────────────────────────────────── */

router.post('/send', requireAuth, async (req, res) => {
  try {
    const subject = String(req.body.subject || '').trim();
    const html    = String(req.body.html    || '').trim();
    const blocks  = req.body.blocks || [];

    if (!subject) return res.status(400).json({ error: 'El asunto es requerido.' });
    if (!html)    return res.status(400).json({ error: 'El contenido HTML es requerido.' });

    const subscribers = await prisma.subscriber.findMany({ where: { active: true } });
    if (subscribers.length === 0) {
      return res.status(400).json({ error: 'No hay suscriptores activos.' });
    }

    const emails = subscribers.map((s) => s.email);
    const { sent, failed } = await sendNewsletterCampaign({ subject, html, emails });

    const campaign = await prisma.newsletterCampaign.create({
      data: {
        subject,
        blocks,
        html,
        sentCount: sent,
        sentAt:    new Date(),
      },
    });

    res.status(201).json({ campaign, sent, failed });
  } catch (err) {
    console.error('[POST /newsletter/send]', err);
    res.status(500).json({ error: 'No se pudo enviar la campaña.' });
  }
});

export default router;
