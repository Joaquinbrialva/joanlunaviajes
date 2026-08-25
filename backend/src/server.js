import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import authRouter from './routes/auth.js';
import ofertasRouter from './routes/ofertas.js';
import destinosRouter from './routes/destinos.js';
import novedadesRouter from './routes/novedades.js';
import cotizacionesRouter from './routes/cotizaciones.js';
import uploadRouter from './routes/upload.js';
import usersRouter from './routes/users.js';

// Sin estas el servidor arranca pero falla en la primera request, que es mucho
// más difícil de diagnosticar que un fallo al arrancar.
const REQUIRED_ENV = ['JWT_SECRET', 'DATABASE_URL', 'SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`[FATAL] Faltan variables de entorno requeridas: ${missing.join(', ')}`);
  process.exit(1);
}

// No son fatales, pero su ausencia degrada el servicio en silencio.
const OPTIONAL_ENV = {
  FRONTEND_URL: 'CORS y los enlaces de los emails apuntarán a localhost:3000.',
  MAIL_USER: 'No se enviará ningún email (registro, recuperación, cotizaciones).',
  MAIL_APP_PASSWORD: 'No se enviará ningún email (registro, recuperación, cotizaciones).',
};
for (const [key, consequence] of Object.entries(OPTIONAL_ENV)) {
  if (!process.env[key]) console.warn(`[WARN] Falta ${key}: ${consequence}`);
}

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
  process.exit(1);
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Demasiados intentos de inicio de sesión. Intentá de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const publicLimiter = rateLimit({
  windowMs: 60_000,
  max: 5,
  message: { error: 'Demasiadas solicitudes. Intentá de nuevo en un minuto.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const app = express();

// Vercel / proxies: necesario para que express-rate-limit lea la IP real
app.set('trust proxy', 1);

app.use(morgan('combined'));
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', publicLimiter);
app.use('/api/auth/forgot-password', publicLimiter);
app.use('/api/auth/resend-code', publicLimiter);
app.use('/api/auth/verify', loginLimiter);
app.use('/api/auth/reset-password', loginLimiter);
app.use('/api/auth', authRouter);
app.use('/api/ofertas', ofertasRouter);
app.use('/api/destinos', destinosRouter);
app.use('/api/novedades', novedadesRouter);
// Solo el POST público va limitado; el GET del staff no debe verse afectado.
app.use('/api/cotizaciones', (req, res, next) => {
  if (req.method === 'POST') return publicLimiter(req, res, next);
  next();
});
app.use('/api/cotizaciones', cotizacionesRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/users', usersRouter);

app.get('/health', (_, res) => res.json({ status: 'ok' }));

// Una ruta /api desconocida debe responder JSON, no el HTML por defecto de Express.
app.use('/api', (req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Error interno del servidor.' });
});

export default app;

if (process.env.NODE_ENV !== 'production' || process.env.LOCAL_SERVER) {
  const PORT = process.env.PORT || 4000;
  const server = app.listen(PORT, async () => {
    console.log(`Backend corriendo en http://localhost:${PORT}`);
    try {
      const { prisma } = await import('./store/prisma.js');
      await prisma.$queryRaw`SELECT 1`;
      console.log('[DB] Conexión a Supabase exitosa');
    } catch (err) {
      console.error('[DB] Error de conexión:', err.message);
    }
  });
  process.on('SIGTERM', () => server.close(() => process.exit(0)));
}
