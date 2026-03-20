import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../store/prisma.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

const VALID_ROLES = ['admin', 'agent', 'designer', 'client'];

function sanitizeUser(user) {
  const { password: _, ...safe } = user;
  return safe;
}

// GET /api/users — list all users (admin only)
router.get('/', requireRole('admin'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(users.map(sanitizeUser));
  } catch {
    res.status(500).json({ error: 'Error al obtener los usuarios.' });
  }
});

// POST /api/users — create user (admin only)
router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const phone = String(req.body.phone || '').trim();
    const role = String(req.body.role || 'client');

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    }
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Rol inválido.' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese email.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, phone, password: hashed, role },
    });

    res.status(201).json(sanitizeUser(user));
  } catch {
    res.status(500).json({ error: 'Error al crear el usuario.' });
  }
});

// PATCH /api/users/:id — update user (admin only)
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
      if (String(newPassword).length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
      }
      updates.password = await bcrypt.hash(String(newPassword), 10);
    }

    const updated = await prisma.user.update({ where: { id }, data: updates });
    res.json(sanitizeUser(updated));
  } catch {
    res.status(500).json({ error: 'Error al actualizar el usuario.' });
  }
});

// DELETE /api/users/:id — delete user (admin only, cannot delete self)
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta desde aquí.' });
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Usuario no encontrado.' });

    // 1. Desvincular cotizaciones (mantenerlas, solo quitar la referencia al usuario)
    await prisma.inquiry.updateMany({
      where: { userId: id },
      data:  { userId: null },
    });

    // 2. Quitar el ID del array readBy en notificaciones
    await prisma.$executeRaw`
      UPDATE "Notification"
      SET "readBy" = array_remove("readBy", ${id})
      WHERE ${id} = ANY("readBy")
    `;

    // 3. Eliminar el usuario
    await prisma.user.delete({ where: { id } });

    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Error al eliminar el usuario.' });
  }
});

export default router;
