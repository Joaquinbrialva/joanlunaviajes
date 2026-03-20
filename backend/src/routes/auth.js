import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomInt } from 'node:crypto';
import { prisma } from '../store/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { sendVerificationCode } from '../store/mailer.js';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COOKIE_NAME = 'auth_token';
const IS_PROD = process.env.NODE_ENV === 'production';

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: IS_PROD ? 'none' : 'lax',
  secure: IS_PROD,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
};

function sanitizeUser(user) {
  const { password: _, verificationCode: __, verificationCodeExpiry: ___, ...safe } = user;
  return safe;
}

function generateCode() {
  return String(randomInt(100000, 1000000));
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const name     = String(req.body.name || '').trim();
    const email    = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const phone    = String(req.body.phone || '').trim();

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos.' });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'El email no tiene un formato válido.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      // Si existe y no está verificado, reenviar código en vez de rechazar
      if (!existing.verified) {
        const code   = generateCode();
        const expiry = new Date(Date.now() + 15 * 60 * 1000);
        const hashed = await bcrypt.hash(code, 8);
        await prisma.user.update({
          where: { id: existing.id },
          data:  { verificationCode: hashed, verificationCodeExpiry: expiry },
        });
        sendVerificationCode({ email, name: existing.name, code }).catch(() => {});
        return res.status(201).json({ message: 'Código de verificación reenviado.' });
      }
      return res.status(409).json({ error: 'Ya existe una cuenta con ese email.' });
    }

    const hashed   = await bcrypt.hash(password, 10);
    const code     = generateCode();
    const expiry   = new Date(Date.now() + 15 * 60 * 1000);
    const codeHash = await bcrypt.hash(code, 8);

    await prisma.user.create({
      data: {
        name, email, phone,
        password: hashed,
        role: 'client',
        verified: false,
        verificationCode: codeHash,
        verificationCodeExpiry: expiry,
      },
    });

    sendVerificationCode({ email, name, code }).catch(() => {});
    res.status(201).json({ message: 'Cuenta creada. Verificá tu email para activarla.' });
  } catch {
    res.status(500).json({ error: 'Error al crear la cuenta.' });
  }
});

// POST /api/auth/verify
router.post('/verify', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const code  = String(req.body.code  || '').trim();

    if (!email || !code) {
      return res.status(400).json({ error: 'Email y código son requeridos.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    if (user.verified) {
      return res.status(400).json({ error: 'La cuenta ya está verificada.' });
    }
    if (!user.verificationCode || !user.verificationCodeExpiry) {
      return res.status(400).json({ error: 'No hay un código de verificación activo.' });
    }
    if (new Date() > new Date(user.verificationCodeExpiry)) {
      return res.status(400).json({ error: 'El código expiró. Solicitá uno nuevo.' });
    }

    const valid = await bcrypt.compare(code, user.verificationCode);
    if (!valid) {
      return res.status(400).json({ error: 'Código incorrecto.' });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data:  { verified: true, verificationCode: null, verificationCodeExpiry: null },
    });

    const token = jwt.sign(
      { id: updated.id, email: updated.email, name: updated.name, role: updated.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
    res.json({ user: sanitizeUser(updated) });
  } catch {
    res.status(500).json({ error: 'Error al verificar el código.' });
  }
});

// POST /api/auth/resend-code
router.post('/resend-code', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ error: 'El email es requerido.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Respuesta genérica para no revelar si el email existe
    if (!user || user.verified) {
      return res.json({ message: 'Si el email existe y no está verificado, recibirás un nuevo código.' });
    }

    const code   = generateCode();
    const expiry = new Date(Date.now() + 15 * 60 * 1000);
    const hashed = await bcrypt.hash(code, 8);

    await prisma.user.update({
      where: { id: user.id },
      data:  { verificationCode: hashed, verificationCodeExpiry: expiry },
    });

    sendVerificationCode({ email, name: user.name, code }).catch(() => {});
    res.json({ message: 'Si el email existe y no está verificado, recibirás un nuevo código.' });
  } catch {
    res.status(500).json({ error: 'Error al reenviar el código.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos.' });
    }

    if (!user.verified) {
      return res.status(403).json({
        error: 'Verificá tu email antes de iniciar sesión.',
        unverified: true,
        email: user.email,
      });
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
  res.clearCookie(COOKIE_NAME, { path: '/', sameSite: COOKIE_OPTIONS.sameSite, secure: COOKIE_OPTIONS.secure });
  res.json({ ok: true });
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
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
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const updates = {};

    if (name !== undefined) {
      const trimmed = String(name).trim();
      if (!trimmed) return res.status(400).json({ error: 'El nombre no puede estar vacío.' });
      updates.name = trimmed;
    }

    if (email !== undefined) {
      const trimmed = String(email).trim().toLowerCase();
      if (!trimmed) return res.status(400).json({ error: 'El email no puede estar vacío.' });
      if (!EMAIL_RE.test(trimmed)) return res.status(400).json({ error: 'El email no tiene un formato válido.' });
      const taken = await prisma.user.findFirst({ where: { email: trimmed, id: { not: req.user.id } } });
      if (taken) return res.status(409).json({ error: 'Ese email ya está en uso.' });
      updates.email = trimmed;
    }

    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ error: 'Ingresá tu contraseña actual.' });
      const valid = await bcrypt.compare(String(currentPassword), user.password);
      if (!valid) return res.status(401).json({ error: 'Contraseña actual incorrecta.' });
      if (String(newPassword).length < 6) {
        return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
      }
      updates.password = await bcrypt.hash(String(newPassword), 10);
    }

    const updated = await prisma.user.update({ where: { id: req.user.id }, data: updates });
    res.json({ user: sanitizeUser(updated) });
  } catch {
    res.status(500).json({ error: 'Error al actualizar el perfil.' });
  }
});

export default router;
