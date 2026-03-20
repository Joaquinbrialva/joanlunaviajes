import { Router } from 'express';
import { prisma } from '../store/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
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
    const { status } = req.query;
    const where = status ? { status } : {};
    const campaigns = await prisma.newsletterCampaign.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(campaigns);
  } catch {
    res.status(500).json({ error: 'No se pudieron obtener las campañas.' });
  }
});

/* ─── Admin: get single campaign ────────────────────────────── */

router.get('/campaigns/:id', requireAuth, async (req, res) => {
  try {
    const campaign = await prisma.newsletterCampaign.findUnique({ where: { id: req.params.id } });
    if (!campaign) return res.status(404).json({ error: 'Campaña no encontrada.' });
    res.json(campaign);
  } catch {
    res.status(500).json({ error: 'No se pudo obtener la campaña.' });
  }
});

/* ─── Admin: create draft ───────────────────────────────────── */

router.post('/campaigns', requireAuth, async (req, res) => {
  try {
    const subject = String(req.body.subject || '').trim();
    const blocks  = req.body.blocks || [];
    const html    = String(req.body.html || '').trim();

    const draft = await prisma.newsletterCampaign.create({
      data: { subject, blocks, html, status: 'draft', sentCount: 0 },
    });

    res.status(201).json(draft);
  } catch (err) {
    console.error('[POST /newsletter/campaigns]', err);
    res.status(500).json({ error: 'No se pudo guardar el borrador.' });
  }
});

/* ─── Admin: update draft ───────────────────────────────────── */

router.patch('/campaigns/:id', requireAuth, async (req, res) => {
  try {
    const campaign = await prisma.newsletterCampaign.findUnique({ where: { id: req.params.id } });
    if (!campaign) return res.status(404).json({ error: 'Campaña no encontrada.' });
    if (campaign.status !== 'draft') return res.status(400).json({ error: 'Solo se pueden editar borradores.' });

    const subject = req.body.subject !== undefined ? String(req.body.subject).trim() : campaign.subject;
    const blocks  = req.body.blocks  !== undefined ? req.body.blocks               : campaign.blocks;
    const html    = req.body.html    !== undefined ? String(req.body.html).trim()  : campaign.html;

    const updated = await prisma.newsletterCampaign.update({
      where: { id: req.params.id },
      data:  { subject, blocks, html },
    });

    res.json(updated);
  } catch (err) {
    console.error('[PATCH /newsletter/campaigns/:id]', err);
    res.status(500).json({ error: 'No se pudo actualizar el borrador.' });
  }
});

/* ─── Admin: send draft ─────────────────────────────────────── */

router.post('/campaigns/:id/send', requireAuth, async (req, res) => {
  try {
    const campaign = await prisma.newsletterCampaign.findUnique({ where: { id: req.params.id } });
    if (!campaign) return res.status(404).json({ error: 'Campaña no encontrada.' });
    if (campaign.status !== 'draft') return res.status(400).json({ error: 'Esta campaña ya fue enviada.' });

    const subscribers = await prisma.subscriber.findMany({ where: { active: true } });
    if (subscribers.length === 0) return res.status(400).json({ error: 'No hay suscriptores activos.' });

    const emails = subscribers.map((s) => s.email);
    const { sent, failed } = await sendNewsletterCampaign({ subject: campaign.subject, html: campaign.html, emails });

    const updated = await prisma.newsletterCampaign.update({
      where: { id: req.params.id },
      data:  { status: 'sent', sentCount: sent, sentAt: new Date() },
    });

    res.json({ campaign: updated, sent, failed });
  } catch (err) {
    console.error('[POST /newsletter/campaigns/:id/send]', err);
    res.status(500).json({ error: 'No se pudo enviar la campaña.' });
  }
});

/* ─── Admin: delete campaign/draft ─────────────────────────── */

router.delete('/campaigns/:id', requireAuth, async (req, res) => {
  try {
    await prisma.newsletterCampaign.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Campaña no encontrada.' });
    res.status(500).json({ error: 'No se pudo eliminar.' });
  }
});

/* ─── Admin: send campaign (new, no draft) ──────────────────── */

router.post('/send', ...requireRole('admin'), async (req, res) => {
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
      data: { subject, blocks, html, status: 'sent', sentCount: sent, sentAt: new Date() },
    });

    res.status(201).json({ campaign, sent, failed });
  } catch (err) {
    console.error('[POST /newsletter/send]', err);
    res.status(500).json({ error: 'No se pudo enviar la campaña.' });
  }
});

export default router;
