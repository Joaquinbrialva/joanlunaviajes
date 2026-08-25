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

const REQUIRED_ENV = ['JWT_SECRET'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`[FATAL] Falta variable de entorno requerida: ${key}`);
    process.exit(1);
  }
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
app.use('/api/auth', authRouter);
app.use('/api/ofertas', ofertasRouter);
app.use('/api/destinos', destinosRouter);
app.use('/api/novedades', novedadesRouter);
app.post('/api/cotizaciones', publicLimiter);
app.use('/api/cotizaciones', cotizacionesRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/users', usersRouter);

app.get('/health', (_, res) => res.json({ status: 'ok' }));

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
