# Registro con Verificación de Email — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar verificación de email al registrarse: el usuario recibe un código OTP de 6 dígitos por email, lo ingresa en `/registro/verificar`, y solo entonces se activa su cuenta y puede iniciar sesión.

**Architecture:** Se agregan tres campos al modelo `User` en Prisma (`verified`, `verificationCode`, `verificationCodeExpiry`). El endpoint `POST /api/auth/register` crea el usuario sin JWT y envía el código. Dos nuevos endpoints (`POST /api/auth/verify` y `POST /api/auth/resend-code`) manejan la verificación y el reenvío. El login bloquea cuentas no verificadas con 403.

**Tech Stack:** Express, Prisma + PostgreSQL (Supabase), bcryptjs, jsonwebtoken, nodemailer, Next.js 16, @heroui/react InputOTP

---

## Archivos a modificar / crear

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `backend/prisma/schema.prisma` | Modificar | Agregar campos `verified`, `verificationCode`, `verificationCodeExpiry` al modelo `User` |
| `backend/src/routes/auth.js` | Modificar | Reescribir `POST /register`, agregar `POST /verify` y `POST /resend-code`, actualizar `POST /login` |
| `backend/src/store/mailer.js` | Modificar | Agregar función `sendVerificationCode(email, name, code)` |
| `backend/src/server.js` | Modificar | Agregar `publicLimiter` a `POST /api/auth/register` y `POST /api/auth/resend-code` |
| `frontend/app/registro/verificar/page.jsx` | ✅ Ya creado | Página OTP con InputOTP de HeroUI |
| `frontend/app/registro/page.jsx` | ✅ Ya modificado | Redirige a `/registro/verificar?email=...` tras registrarse |

---

## Task 1: Migración de Prisma — agregar campos de verificación al modelo User

**Files:**
- Modify: `backend/prisma/schema.prisma`

- [ ] **Step 1: Agregar campos al modelo `User`**

En `backend/prisma/schema.prisma`, el modelo `User` actualmente termina en `updatedAt`. Reemplazarlo por:

```prisma
model User {
  id                     String    @id @default(uuid())
  name                   String
  email                  String    @unique
  phone                  String    @default("")
  password               String
  role                   String
  verified               Boolean   @default(false)
  verificationCode       String?
  verificationCodeExpiry DateTime?
  createdAt              DateTime  @default(now())
  updatedAt              DateTime  @updatedAt
}
```

- [ ] **Step 2: Aplicar la migración a la base de datos**

Ejecutar desde `backend/`:
```bash
npx prisma db push
```

Salida esperada: `Your database is now in sync with your Prisma schema.`

> **Nota Vercel/producción:** `db push` es suficiente para este proyecto. No usar `migrate dev` ya que el entorno de producción usa el mismo schema.

- [ ] **Step 3: Regenerar el cliente de Prisma**

```bash
npx prisma generate
```

- [ ] **Step 4: Verificar que el servidor local levanta sin errores**

```bash
npm run dev
```

Esperado: `Backend corriendo en http://localhost:4000`

- [ ] **Step 5: Commit**

```bash
git add backend/prisma/schema.prisma
git commit -m "feat: agregar campos verified y verificationCode al modelo User"
```

---

## Task 2: Función `sendVerificationCode` en mailer

**Files:**
- Modify: `backend/src/store/mailer.js`

- [ ] **Step 1: Agregar la función al final de `mailer.js`**

Agregar después de `sendConfirmationToClient`, antes de `sendNewsletterCampaign`:

```js
/* ─── Email: código de verificación ───────────────────────── */

export function sendVerificationCode({ email, name, code }) {
  const safeName = escapeHtml(name);
  const safeCode = escapeHtml(code);

  const html = baseTemplate({
    title: 'Verificá tu cuenta',
    preheader: `Tu código de verificación es ${safeCode}. Válido por 15 minutos.`,
    body: `
      <h1 style="margin:0 0 6px;font-size:22px;color:#1c1917;font-weight:700;">Hola, ${safeName}</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#78716c;">
        Para activar tu cuenta en Joanluna Viajes, ingresá el siguiente código:
      </p>

      <div style="text-align:center;margin:28px 0;">
        <div style="display:inline-block;background:#fff7ed;border:2px solid #fed7aa;border-radius:16px;padding:20px 40px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#a8a29e;">
            Código de verificación
          </p>
          <p style="margin:0;font-size:36px;font-weight:800;letter-spacing:0.2em;color:#ff7e2d;font-family:monospace;">
            ${safeCode}
          </p>
        </div>
      </div>

      <p style="margin:0 0 8px;font-size:14px;color:#78716c;text-align:center;">
        Este código expira en <strong style="color:#1c1917;">15 minutos</strong>.
      </p>
      <p style="margin:0;font-size:13px;color:#a8a29e;text-align:center;">
        Si no creaste esta cuenta, ignorá este mensaje.
      </p>
    `,
  });

  return sendMail({
    to: email,
    subject: `${safeCode} — tu código de verificación · Joanluna Viajes`,
    html,
    text: `Hola ${name}, tu código de verificación es: ${code}. Válido por 15 minutos.`,
  });
}
```

- [ ] **Step 2: Verificar que el servidor levanta sin errores**

```bash
npm run dev
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/store/mailer.js
git commit -m "feat: agregar template de email para código de verificación"
```

---

## Task 3: Endpoints de autenticación — register, verify, resend-code, login

**Files:**
- Modify: `backend/src/routes/auth.js`

### 3a — Modificar `POST /api/auth/register`

El endpoint actual crea el usuario y emite JWT inmediatamente. Hay que cambiar ese comportamiento para:
1. Crear el usuario con `verified: false`
2. Generar un código de 6 dígitos aleatorio
3. Guardar el código hasheado y la fecha de expiración (15 min)
4. Enviar el email con el código
5. Responder 201 **sin** emitir cookie

- [ ] **Step 1: Agregar imports en `auth.js`**

Al inicio del archivo, agregar después de las importaciones actuales:

```js
import { randomInt } from 'node:crypto';
import { sendVerificationCode } from '../store/mailer.js';
```

- [ ] **Step 2: Agregar función helper `generateCode` y actualizar `sanitizeUser` antes del primer router.post**

Reemplazar `sanitizeUser` existente y agregar `generateCode`:

```js
function sanitizeUser(user) {
  const { password: _, verificationCode: __, verificationCodeExpiry: ___, ...safe } = user;
  return safe;
}

function generateCode() {
  return String(randomInt(100000, 1000000));
}
```

- [ ] **Step 3: Reemplazar el cuerpo de `POST /register`**

Reemplazar todo el handler actual de `router.post('/register', ...)` con:

```js
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
```

### 3b — Agregar `POST /api/auth/verify`

- [ ] **Step 4: Agregar endpoint verify después del handler de register**

```js
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
```

### 3c — Agregar `POST /api/auth/resend-code`

- [ ] **Step 5: Agregar endpoint resend-code después de verify**

```js
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
```

### 3d — Actualizar `POST /api/auth/login` para bloquear no verificados

- [ ] **Step 6: Agregar chequeo de `verified` en el login**

En el handler de `router.post('/login', ...)`, después de validar la contraseña (línea `if (!user || !(await bcrypt.compare(...)))`), agregar:

```js
if (!user.verified) {
  return res.status(403).json({
    error: 'Verificá tu email antes de iniciar sesión.',
    unverified: true,
    email: user.email,
  });
}
```

- [ ] **Step 7: Verificar que el servidor levanta sin errores**

```bash
npm run dev
```

- [ ] **Step 8: Commit**

```bash
git add backend/src/routes/auth.js
git commit -m "feat: verificación de email en registro — verify y resend-code endpoints"
```

---

## Task 4: Rate limiting para endpoints públicos nuevos

**Files:**
- Modify: `backend/src/server.js`

Los endpoints `POST /api/auth/register` y `POST /api/auth/resend-code` son públicos y deben estar protegidos. `publicLimiter` (5 req/min) ya existe.

- [ ] **Step 1: Agregar los limiters antes de montar el router de auth**

En `server.js`, donde se aplica `app.use('/api/auth/login', loginLimiter)`, agregar debajo:

```js
app.post('/api/auth/register',    publicLimiter);
app.post('/api/auth/resend-code', publicLimiter);
```

El bloque completo debe quedar así:
```js
app.use('/api/auth/login', loginLimiter);
app.post('/api/auth/register',    publicLimiter);
app.post('/api/auth/resend-code', publicLimiter);
app.use('/api/auth', authRouter);
```

- [ ] **Step 2: Verificar que el servidor levanta**

```bash
npm run dev
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/server.js
git commit -m "feat: rate limiting en /register y /resend-code"
```

---

## Task 5: Actualizar login frontend para manejar cuenta no verificada

**Files:**
- Modify: `frontend/app/login/page.jsx`

Si el login devuelve `403` con `unverified: true`, redirigir al usuario a `/registro/verificar?email=...` para que complete la verificación.

- [ ] **Step 1: Modificar el handler de error en `login/page.jsx`**

En `handleSubmit`, reemplazar:
```js
if (!res.ok) { setError(data.error || 'Error al iniciar sesión.'); return; }
```

Por:
```js
if (!res.ok) {
  if (res.status === 403 && data.unverified) {
    window.location.href = `/registro/verificar?email=${encodeURIComponent(data.email)}`;
    return;
  }
  setError(data.error || 'Error al iniciar sesión.');
  return;
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/app/login/page.jsx
git commit -m "feat: redirigir al flujo de verificación si la cuenta no está verificada"
```

---

## Task 6: Verificación manual end-to-end

- [ ] **Step 1: Levantar backend y frontend**

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

- [ ] **Step 2: Registrar usuario nuevo**

Ir a `http://localhost:3000/registro`, completar el formulario y enviar.

Esperado: redirección a `/registro/verificar?email=tu@email.com`

- [ ] **Step 3: Verificar que el email llegó**

Revisar la bandeja de entrada. Debe llegar un email con subject `XXXXXX — tu código de verificación · Joanluna Viajes` y el código de 6 dígitos visible en el cuerpo.

- [ ] **Step 4: Ingresar el código en la página de verificación**

Tipear el código en los 6 campos del InputOTP.

Esperado: auto-submit al completar el 6to dígito → mensaje "¡Cuenta verificada!" → redirección a `/cuenta`

- [ ] **Step 5: Verificar la página `/cuenta`**

Debe mostrar el nombre del usuario, email, y la sección de cotizaciones (vacía).

- [ ] **Step 6: Probar código incorrecto**

Ir a otra cuenta, ingresar un código erróneo.

Esperado: mensaje "Código incorrecto." y los campos se limpian.

- [ ] **Step 7: Probar código expirado**

Con un código expirado (o modificar temporalmente `15 * 60 * 1000` a `5000` ms para testear), verificar que aparece "El código expiró. Solicitá uno nuevo." y el botón "Reenviar código" está habilitado.

- [ ] **Step 8: Probar login con cuenta no verificada**

Registrar usuario, no verificar, e intentar login.

Esperado: redirección a `/registro/verificar?email=...`

- [ ] **Step 9: Probar reenvío de código**

En `/registro/verificar`, hacer click en "Reenviar código".

Esperado: toast "Código reenviado", timer se reinicia a 15:00, campo OTP se limpia.

---

## Task 7: Commit final, merge y deploy

- [ ] **Step 1: Asegurarse de estar en branch `dev`**

```bash
git branch
```

- [ ] **Step 2: Push a origin**

```bash
git push origin dev
```

- [ ] **Step 3: Merge a main**

```bash
git checkout main
git merge dev --no-ff -m "feat: registro con verificación de email por código OTP

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
git push origin main
```

Esperado: Vercel detecta el push a `main` y dispara el redeploy automático de ambos proyectos.

- [ ] **Step 4: Verificar el deploy en producción**

Una vez que Vercel termine:
1. Ir a `https://joanlunaviajes.vercel.app/health` → `{"status":"ok"}`
2. Registrar un usuario real en `https://joanlunaviajes-eho9.vercel.app/registro`
3. Verificar que llega el email y que el código funciona
