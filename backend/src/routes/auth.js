import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../store/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const COOKIE_NAME = 'auth_token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
};

function sanitizeUser(user) {
  const { password: _, ...safe } = user;
  return safe;
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos.' });
    }

    const users = await db.users.read();
    const user = users.find((u) => u.email.toLowerCase() === email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
    res.json({ user: sanitizeUser(user) });
  } catch {
    res.status(500).json({ error: 'Error al iniciar sesión.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ ok: true });
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const users = await db.users.read();
    const user = users.find((u) => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
    res.json({ user: sanitizeUser(user) });
  } catch {
    res.status(500).json({ error: 'Error al obtener usuario.' });
  }
});

// PATCH /api/auth/me
router.patch('/me', requireAuth, async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    const users = await db.users.read();
    const index = users.findIndex((u) => u.id === req.user.id);
    if (index === -1) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const user = { ...users[index] };

    if (name !== undefined) {
      const trimmed = String(name).trim();
      if (!trimmed) return res.status(400).json({ error: 'El nombre no puede estar vacío.' });
      user.name = trimmed;
    }

    if (email !== undefined) {
      const trimmed = String(email).trim().toLowerCase();
      if (!trimmed) return res.status(400).json({ error: 'El email no puede estar vacío.' });
      const taken = users.some((u, i) => i !== index && u.email.toLowerCase() === trimmed);
      if (taken) return res.status(409).json({ error: 'Ese email ya está en uso.' });
      user.email = trimmed;
    }

    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ error: 'Ingresá tu contraseña actual.' });
      const valid = await bcrypt.compare(String(currentPassword), user.password);
      if (!valid) return res.status(401).json({ error: 'Contraseña actual incorrecta.' });
      if (String(newPassword).length < 6) {
        return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
      }
      user.password = await bcrypt.hash(String(newPassword), 10);
    }

    users[index] = user;
    await db.users.write(users);
    res.json({ user: sanitizeUser(user) });
  } catch {
    res.status(500).json({ error: 'Error al actualizar el perfil.' });
  }
});

export default router;
