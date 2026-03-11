import { Router } from 'express';
import { db, nextInquiryId } from '../store/db.js';

const router = Router();

// GET /api/cotizaciones
router.get('/', async (req, res) => {
  try {
    const inquiries = await db.inquiries.read();
    res.json(inquiries);
  } catch {
    res.status(500).json({ error: 'No se pudieron obtener las cotizaciones.' });
  }
});

// POST /api/cotizaciones
router.post('/', async (req, res) => {
  try {
    const body = req.body;
    const inquiries = await db.inquiries.read();

    const name = String(body.name || '').trim();
    const phone = String(body.phone || '').trim();

    if (!name || !phone) {
      return res.status(400).json({ error: 'Completá nombre y teléfono.' });
    }

    const now = new Date().toISOString();
    const newInquiry = {
      id: nextInquiryId(inquiries),
      name,
      email: String(body.email || '').trim(),
      phone,
      passengers: Math.max(1, Number(body.passengers || 1)),
      message: String(body.message || '').trim(),
      offerSlug: String(body.offerSlug || '').trim() || null,
      offerTitle: String(body.offerTitle || '').trim() || null,
      destinationSlug: String(body.destinationSlug || '').trim() || null,
      notes: '',
      status: 'pending',
      createdAt: now,
    };

    await db.inquiries.write([newInquiry, ...inquiries]);
    res.status(201).json(newInquiry);
  } catch {
    res.status(500).json({ error: 'No se pudo guardar la cotización.' });
  }
});

// PATCH /api/cotizaciones/:id — actualizar estado y/o notas
router.patch('/:id', async (req, res) => {
  try {
    const inquiries = await db.inquiries.read();
    const index = inquiries.findIndex((i) => i.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Cotización no encontrada.' });

    const allowed = ['pending', 'contacted', 'closed'];
    const status = String(req.body.status || '').trim();
    if (status && !allowed.includes(status)) {
      return res.status(400).json({ error: `Estado inválido. Opciones: ${allowed.join(', ')}.` });
    }

    const updates = { updatedAt: new Date().toISOString() };
    if (status) updates.status = status;
    if (req.body.notes !== undefined) updates.notes = String(req.body.notes);

    inquiries[index] = { ...inquiries[index], ...updates };
    await db.inquiries.write(inquiries);
    res.json(inquiries[index]);
  } catch {
    res.status(500).json({ error: 'No se pudo actualizar la cotización.' });
  }
});

// DELETE /api/cotizaciones/:id
router.delete('/:id', async (req, res) => {
  try {
    const inquiries = await db.inquiries.read();
    const filtered = inquiries.filter((i) => i.id !== req.params.id);
    if (filtered.length === inquiries.length) {
      return res.status(404).json({ error: 'Cotización no encontrada.' });
    }
    await db.inquiries.write(filtered);
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'No se pudo eliminar la cotización.' });
  }
});

export default router;
