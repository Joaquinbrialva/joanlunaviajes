import { Router } from 'express';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../store/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { validatePassword } from '../store/utils.js';
import { sendVerificationCode, sendPasswordReset } from '../store/mailer.js';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COOKIE_NAME = 'auth_token';
const IS_PROD = process.env.NODE_ENV === 'production';

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: IS_PROD ? 'none' : 'lax',
  secure: IS_PROD,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const VERIFICATION_TTL_MS = 15 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;

function sanitizeUser(user) {
  const {
    password: _,
    verificationCode: __,
    verificationCodeExpiry: ___,
    resetToken: ____,
    resetTokenExpiry: _____,
    ...safe
  } = user;
  return safe;
}

function frontendUrl() {
  return process.env.FRONTEND_URL || 'http://localhost:3000';
}

function issueSession(res, user) {
  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
  res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
}

// 6 dígitos. Se guarda en claro: la entropía es baja de todos modos, así que la
// defensa real es la expiración corta más el rate limiting del endpoint.
function generateVerificationCode() {
  return String(crypto.randomInt(100000, 1000000));
}

// El token de reseteo sí se guarda hasheado: es de alta entropía y de larga
// vida relativa, así que filtrar la tabla no debe alcanzar para secuestrar cuentas.
function generateResetToken() {
  const raw = crypto.randomBytes(32).toString('hex');
  return { raw, hash: crypto.createHash('sha256').update(raw).digest('hex') };
}

function hashResetToken(raw) {
  return crypto.createHash('sha256').update(String(raw)).digest('hex');
}

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
        error: 'Tu cuenta todavía no está verificada. Revisá tu email para activarla.',
        needsVerification: true,
      });
    }

    issueSession(res, user);
    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error('[auth/login]', err);
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
      const pwdErr = validatePassword(String(newPassword));
      if (pwdErr) return res.status(400).json({ error: pwdErr });
      updates.password = await bcrypt.hash(String(newPassword), 10);
    }

    const updated = await prisma.user.update({ where: { id: req.user.id }, data: updates });
    res.json({ user: sanitizeUser(updated) });
  } catch {
    res.status(500).json({ error: 'Error al actualizar el perfil.' });
  }
});

// POST /api/auth/register - alta publica de clientes
router.post('/register', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const phone = String(req.body.phone || '').trim();
    const password = String(req.body.password || '');

    if (!name || !email) {
      return res.status(400).json({ error: 'Nombre y email son requeridos.' });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'El email no tiene un formato válido.' });
    }
    const pwdErr = validatePassword(password);
    if (pwdErr) return res.status(400).json({ error: pwdErr });

    const existing = await prisma.user.findUnique({ where: { email } });

    // Un registro sobre una cuenta sin verificar reemplaza el código pendiente,
    // en vez de dejar al usuario trabado sin poder reintentar.
    if (existing && existing.verified) {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese email.' });
    }

    const code = generateVerificationCode();
    const data = {
      name,
      email,
      phone,
      password: await bcrypt.hash(password, 10),
      role: 'client',
      verified: false,
      verificationCode: code,
      verificationCodeExpiry: new Date(Date.now() + VERIFICATION_TTL_MS),
    };

    const user = existing
      ? await prisma.user.update({ where: { id: existing.id }, data })
      : await prisma.user.create({ data });

    sendVerificationCode({ email, name, code }).catch((err) => {
      console.warn('[mailer] No se pudo enviar el código de verificación:', err.message);
    });

    res.status(201).json({ ok: true, email: user.email });
  } catch (err) {
    console.error('[POST /api/auth/register]', err);
    res.status(500).json({ error: 'No se pudo crear la cuenta.' });
  }
});

// POST /api/auth/verify - confirma el codigo y deja la sesion iniciada
router.post('/verify', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const code = String(req.body.code || '').trim();

    if (!email || !code) {
      return res.status(400).json({ error: 'Email y código son requeridos.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Código incorrecto.' });

    if (user.verified) {
      issueSession(res, user);
      return res.json({ user: sanitizeUser(user) });
    }

    const expired = !user.verificationCodeExpiry || user.verificationCodeExpiry < new Date();
    if (expired) {
      return res.status(400).json({ error: 'El código venció. Pedí uno nuevo.' });
    }

    const stored = String(user.verificationCode || '');
    const match =
      stored.length === code.length &&
      crypto.timingSafeEqual(Buffer.from(stored), Buffer.from(code));
    if (!stored || !match) {
      return res.status(400).json({ error: 'Código incorrecto.' });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { verified: true, verificationCode: null, verificationCodeExpiry: null },
    });

    issueSession(res, updated);
    res.json({ user: sanitizeUser(updated) });
  } catch (err) {
    console.error('[POST /api/auth/verify]', err);
    res.status(500).json({ error: 'No se pudo verificar la cuenta.' });
  }
});

// POST /api/auth/resend-code
router.post('/resend-code', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ error: 'El email es requerido.' });

    const user = await prisma.user.findUnique({ where: { email } });

    // Respuesta uniforme: quien pregunta no debe poder deducir qué emails existen.
    if (!user || user.verified) return res.json({ ok: true });

    const code = generateVerificationCode();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode: code,
        verificationCodeExpiry: new Date(Date.now() + VERIFICATION_TTL_MS),
      },
    });

    sendVerificationCode({ email, name: user.name, code }).catch((err) => {
      console.warn('[mailer] No se pudo reenviar el código:', err.message);
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('[POST /api/auth/resend-code]', err);
    res.status(500).json({ error: 'No se pudo reenviar el código.' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Ingresá un email válido.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Respuesta uniforme exista o no la cuenta, para no filtrar el padrón.
    if (user) {
      const { raw, hash } = generateResetToken();
      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: hash, resetTokenExpiry: new Date(Date.now() + RESET_TTL_MS) },
      });

      const resetUrl =
        `${frontendUrl()}/olvide-contrasena/restablecer` +
        `?token=${raw}&email=${encodeURIComponent(email)}`;

      sendPasswordReset({ email, name: user.name, resetUrl }).catch((err) => {
        console.warn('[mailer] No se pudo enviar el reset de contraseña:', err.message);
      });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('[POST /api/auth/forgot-password]', err);
    res.status(500).json({ error: 'No se pudo procesar la solicitud.' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const token = String(req.body.token || '').trim();
    const password = String(req.body.password || '');

    if (!email || !token) {
      return res.status(400).json({ error: 'El enlace no es válido.' });
    }
    const pwdErr = validatePassword(password);
    if (pwdErr) return res.status(400).json({ error: pwdErr });

    const user = await prisma.user.findUnique({ where: { email } });
    const expired = !user?.resetTokenExpiry || user.resetTokenExpiry < new Date();
    if (!user || !user.resetToken || expired) {
      return res.status(400).json({ error: 'El enlace venció o no es válido. Pedí uno nuevo.' });
    }

    const candidate = hashResetToken(token);
    const match = crypto.timingSafeEqual(
      Buffer.from(user.resetToken, 'hex'),
      Buffer.from(candidate, 'hex')
    );
    if (!match) {
      return res.status(400).json({ error: 'El enlace venció o no es válido. Pedí uno nuevo.' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(password, 10),
        resetToken: null,
        resetTokenExpiry: null,
        mustChangePassword: false,
        // Quien recuperó la cuenta por email ya probó ser dueño de la casilla.
        verified: true,
      },
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('[POST /api/auth/reset-password]', err);
    res.status(500).json({ error: 'No se pudo restablecer la contraseña.' });
  }
});

// POST /api/auth/change-temp-password - para cuentas con mustChangePassword
router.post('/change-temp-password', requireAuth, async (req, res) => {
  try {
    const password = String(req.body.password || '');
    const pwdErr = validatePassword(password);
    if (pwdErr) return res.status(400).json({ error: pwdErr });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const same = await bcrypt.compare(password, user.password);
    if (same) {
      return res.status(400).json({ error: 'La contraseña nueva debe ser distinta de la actual.' });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { password: await bcrypt.hash(password, 10), mustChangePassword: false },
    });

    // Renueva la cookie para que el token refleje el estado actual de la cuenta.
    issueSession(res, updated);
    res.json({ user: sanitizeUser(updated) });
  } catch (err) {
    console.error('[POST /api/auth/change-temp-password]', err);
    res.status(500).json({ error: 'No se pudo cambiar la contraseña.' });
  }
});

export default router;
