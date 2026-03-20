import { Router } from 'express';
import { prisma, withRetry } from '../store/prisma.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { createNotification } from '../store/notifications.js';
import { sendInquiryToAgency, sendConfirmationToClient } from '../store/mailer.js';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GET /api/cotizaciones
router.get('/', requireAuth, async (req, res) => {
  try {
    const inquiries = await prisma.inquiry.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(inquiries);
  } catch {
    res.status(500).json({ error: 'No se pudieron obtener las cotizaciones.' });
  }
});

// GET /api/cotizaciones/mis — consultas del usuario logueado
router.get('/mis', requireAuth, async (req, res) => {
  try {
    const inquiries = await prisma.inquiry.findMany({
      where: {
        OR: [
          { userId: req.user.id },
          { email: req.user.email },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(inquiries);
  } catch {
    res.status(500).json({ error: 'No se pudieron obtener las consultas.' });
  }
});

// POST /api/cotizaciones
router.post('/', optionalAuth, async (req, res) => {
  try {
    const body = req.body;
    const name = String(body.name || '').trim();
    const phone = String(body.phone || '').trim();
    const email = String(body.email || '').trim().toLowerCase();

    if (!name || !phone) {
      return res.status(400).json({ error: 'Completá nombre y teléfono.' });
    }
    if (email && !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'El email no tiene un formato válido.' });
    }

    const newInquiry = await prisma.inquiry.create({
      data: {
        name,
        email,
        phone,
        passengers: Math.max(1, Number(body.passengers || 1)),
        message: String(body.message || '').trim(),
        offerSlug: String(body.offerSlug || '').trim() || null,
        offerTitle: String(body.offerTitle || '').trim() || null,
        destinationSlug: String(body.destinationSlug || '').trim() || null,
        notes: '',
        status: 'pending',
        userId: req.user?.id || null,
      },
    });

    // Notificar a admins y agentes
    const subject = newInquiry.offerTitle
      ? `"${newInquiry.offerTitle}"`
      : newInquiry.destinationSlug
        ? newInquiry.destinationSlug.replace(/-/g, ' ')
        : 'consulta general';

    createNotification({
      type: 'new_inquiry',
      title: 'Nueva consulta recibida',
      body: `${name} envió una consulta sobre ${subject}.`,
      forRoles: ['admin', 'agent'],
      inquiryId: newInquiry.id,
    }).catch(() => {});

    // Emails — non-blocking, never fail the request
    sendInquiryToAgency(newInquiry).catch(() => {});
    sendConfirmationToClient(newInquiry).catch(() => {});

    res.status(201).json(newInquiry);
  } catch (err) {
    console.error('[POST /api/cotizaciones]', err);
    res.status(500).json({ error: 'No se pudo guardar la cotización.' });
  }
});

// GET /api/cotizaciones/:id — detalle (admin o dueño de la cotización)
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const inquiry = await prisma.inquiry.findUnique({ where: { id: req.params.id } });
    if (!inquiry) return res.status(404).json({ error: 'Cotización no encontrada.' });

    const isStaff = ['admin', 'agent', 'designer'].includes(req.user.role);
    const isOwner = inquiry.userId === req.user.id || inquiry.email === req.user.email;
    if (!isStaff && !isOwner) return res.status(403).json({ error: 'Sin acceso.' });

    res.json(inquiry);
  } catch {
    res.status(500).json({ error: 'No se pudo obtener la cotización.' });
  }
});

// PATCH /api/cotizaciones/:id — actualizar estado y/o notas
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const allowed = ['pending', 'contacted', 'closed'];
    const status = String(req.body.status || '').trim();
    if (status && !allowed.includes(status)) {
      return res.status(400).json({ error: `Estado inválido. Opciones: ${allowed.join(', ')}.` });
    }

    const updates = {};
    if (status) updates.status = status;
    if (req.body.notes !== undefined) updates.notes = String(req.body.notes);

    const updated = await withRetry(() => prisma.inquiry.update({
      where: { id: req.params.id },
      data: updates,
    }));

    res.json(updated);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Cotización no encontrada.' });
    res.status(500).json({ error: 'No se pudo actualizar la cotización.' });
  }
});

// DELETE /api/cotizaciones/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await prisma.inquiry.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Cotización no encontrada.' });
    res.status(500).json({ error: 'No se pudo eliminar la cotización.' });
  }
});

export default router;
