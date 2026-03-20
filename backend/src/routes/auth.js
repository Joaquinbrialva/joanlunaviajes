import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomInt, randomBytes, createHash } from 'node:crypto';
import { prisma } from '../store/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { sendVerificationCode, sendPasswordReset } from '../store/mailer.js';
import { validatePassword } from '../store/utils.js';

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
    const pwdErrReg = validatePassword(password);
    if (pwdErrReg) return res.status(400).json({ error: pwdErrReg });

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
      { id: updated.id, email: updated.email, name: updated.name, role: updated.role, mustChangePassword: updated.mustChangePassword },
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

    // Raw query para leer mustChangePassword (campo agregado después de generate)
    const [flags] = await prisma.$queryRaw`SELECT "mustChangePassword" FROM "User" WHERE id = ${user.id}`;
    const mustChangePassword = flags?.mustChangePassword ?? false;

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role, mustChangePassword },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
    res.json({ user: { ...sanitizeUser(user), mustChangePassword } });
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

// POST /api/auth/change-temp-password
router.post('/change-temp-password', requireAuth, async (req, res) => {
  try {
    const password = String(req.body.password || '');
    const pwdErrTemp = validatePassword(password);
    if (pwdErrTemp) return res.status(400).json({ error: pwdErrTemp });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const hashed = await bcrypt.hash(password, 10);
    await prisma.$executeRaw`UPDATE "User" SET password = ${hashed}, "mustChangePassword" = false, "updatedAt" = now() WHERE id = ${user.id}`;

    // Emitir nuevo JWT sin mustChangePassword
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role, mustChangePassword: false },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Error al cambiar la contraseña.' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ error: 'El email es requerido.' });

    // Respuesta genérica siempre para no revelar si el email existe
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && user.verified) {
      const token  = randomBytes(32).toString('hex');
      const hash   = createHash('sha256').update(token).digest('hex');
      const expiry = new Date(Date.now() + 30 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data:  { resetToken: hash, resetTokenExpiry: expiry },
      });

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const resetUrl = `${frontendUrl}/olvide-contrasena/restablecer?token=${token}&email=${encodeURIComponent(email)}`;
      sendPasswordReset({ email, name: user.name, resetUrl }).catch(() => {});
    }

    res.json({ message: 'Si el email existe, recibirás un enlace para restablecer tu contraseña.' });
  } catch {
    res.status(500).json({ error: 'Error al procesar la solicitud.' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const email    = String(req.body.email    || '').trim().toLowerCase();
    const token    = String(req.body.token    || '').trim();
    const password = String(req.body.password || '');

    if (!email || !token || !password) {
      return res.status(400).json({ error: 'Email, token y contraseña son requeridos.' });
    }
    const pwdErrReset = validatePassword(password);
    if (pwdErrReset) return res.status(400).json({ error: pwdErrReset });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.resetToken || !user.resetTokenExpiry) {
      return res.status(400).json({ error: 'El enlace es inválido o ya fue usado.' });
    }
    if (new Date() > new Date(user.resetTokenExpiry)) {
      return res.status(400).json({ error: 'El enlace expiró. Solicitá uno nuevo.' });
    }

    const hash = createHash('sha256').update(token).digest('hex');
    if (hash !== user.resetToken) {
      return res.status(400).json({ error: 'El enlace es inválido o ya fue usado.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data:  { password: hashed, resetToken: null, resetTokenExpiry: null },
    });

    res.json({ message: 'Contraseña actualizada correctamente.' });
  } catch {
    res.status(500).json({ error: 'Error al restablecer la contraseña.' });
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
      const pwdErrProfile = validatePassword(String(newPassword));
      if (pwdErrProfile) return res.status(400).json({ error: pwdErrProfile });
      updates.password = await bcrypt.hash(String(newPassword), 10);
    }

    const updated = await prisma.user.update({ where: { id: req.user.id }, data: updates });
    res.json({ user: sanitizeUser(updated) });
  } catch {
    res.status(500).json({ error: 'Error al actualizar el perfil.' });
  }
});

export default router;
