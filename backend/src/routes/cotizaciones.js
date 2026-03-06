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
    const email = String(body.email || '').trim();

    if (!name || !email) {
      return res.status(400).json({ error: 'Completá nombre y email.' });
    }

    const now = new Date().toISOString();
    const newInquiry = {
      id: nextInquiryId(inquiries),
      name,
      email,
      phone: String(body.phone || '').trim(),
      message: String(body.message || '').trim(),
      offerSlug: String(body.offerSlug || '').trim() || null,
      destinationSlug: String(body.destinationSlug || '').trim() || null,
      status: 'pending',
      createdAt: now,
    };

    await db.inquiries.write([newInquiry, ...inquiries]);
    res.status(201).json(newInquiry);
  } catch {
    res.status(500).json({ error: 'No se pudo guardar la cotización.' });
  }
});

// PATCH /api/cotizaciones/:id — actualizar estado
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

    inquiries[index] = { ...inquiries[index], ...(status && { status }), updatedAt: new Date().toISOString() };
    await db.inquiries.write(inquiries);
    res.json(inquiries[index]);
  } catch {
    res.status(500).json({ error: 'No se pudo actualizar la cotización.' });
  }
});

export default router;
