import { Router } from 'express';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../store/prisma.js';
import { requireRole } from '../middleware/auth.js';
import { sendWelcomeWithPassword } from '../store/mailer.js';
import { validatePassword } from '../store/utils.js';

// Math.random() no es criptográficamente seguro: una contraseña generada con él
// es predecible a partir de otras salidas del mismo generador.
function generateTempPassword(length = 12) {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%&*';
  const all = upper + lower + digits + symbols;
  const pick = (set) => set[crypto.randomInt(set.length)];

  // Un carácter de cada clase garantiza que pase validatePassword; el resto al azar.
  const chars = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  while (chars.length < length) chars.push(pick(all));

  // Fisher-Yates, para que las posiciones fijas no sean predecibles.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

const router = Router();

const VALID_ROLES = ['admin', 'agent', 'designer', 'client'];

function sanitizeUser(user) {
  const { password: _, ...safe } = user;
  return safe;
}

// GET /api/users
router.get('/', requireRole('admin'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(users.map(sanitizeUser));
  } catch {
    res.status(500).json({ error: 'Error al obtener los usuarios.' });
  }
});

// POST /api/users
router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const name  = String(req.body.name  || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const phone = String(req.body.phone || '').trim();
    const role  = String(req.body.role  || 'client');

    if (!name || !email) {
      return res.status(400).json({ error: 'Nombre y email son requeridos.' });
    }
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Rol inválido.' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese email.' });
    }

    const tempPassword = generateTempPassword();
    const hashed = await bcrypt.hash(tempPassword, 10);
    const user = await prisma.user.create({
      data: { name, email, phone, password: hashed, role, verified: true, mustChangePassword: true },
    });

    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`;
    sendWelcomeWithPassword({ email, name, password: tempPassword, loginUrl }).catch((err) => {
      console.warn('[mailer] No se pudo enviar email de bienvenida:', err.message);
    });

    res.status(201).json(sanitizeUser(user));
  } catch {
    res.status(500).json({ error: 'Error al crear el usuario.' });
  }
});

// PATCH /api/users/:id
router.patch('/:id', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, newPassword } = req.body;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const updates = {};

    if (name !== undefined) {
      const trimmed = String(name).trim();
      if (!trimmed) return res.status(400).json({ error: 'El nombre no puede estar vacío.' });
      updates.name = trimmed;
    }

    if (email !== undefined) {
      const trimmed = String(email).trim().toLowerCase();
      if (!trimmed) return res.status(400).json({ error: 'El email no puede estar vacío.' });
      const taken = await prisma.user.findFirst({ where: { email: trimmed, id: { not: id } } });
      if (taken) return res.status(409).json({ error: 'Ese email ya está en uso.' });
      updates.email = trimmed;
    }

    if (phone !== undefined) {
      updates.phone = String(phone).trim();
    }

    if (role !== undefined) {
      if (!VALID_ROLES.includes(role)) return res.status(400).json({ error: 'Rol inválido.' });
      updates.role = role;
    }

    if (newPassword !== undefined && newPassword !== '') {
      const pwdErr = validatePassword(String(newPassword));
      if (pwdErr) return res.status(400).json({ error: pwdErr });
      updates.password = await bcrypt.hash(String(newPassword), 10);
    }

    const updated = await prisma.user.update({ where: { id }, data: updates });
    res.json(sanitizeUser(updated));
  } catch {
    res.status(500).json({ error: 'Error al actualizar el usuario.' });
  }
});

// DELETE /api/users/:id
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta desde aquí.' });
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Usuario no encontrado.' });

    await prisma.inquiry.updateMany({ where: { userId: id }, data: { userId: null } });
    await prisma.user.delete({ where: { id } });

    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Error al eliminar el usuario.' });
  }
});

export default router;
