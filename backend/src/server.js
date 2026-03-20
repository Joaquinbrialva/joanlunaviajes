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
import cotizacionesRouter from './routes/cotizaciones.js';
import uploadRouter from './routes/upload.js';
import notificationsRouter from './routes/notifications.js';
import settingsRouter from './routes/settings.js';
import usersRouter from './routes/users.js';
import newsletterRouter from './routes/newsletter.js';

// Validar variables de entorno requeridas
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

app.use(morgan('combined'));
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth/login', loginLimiter);
app.post('/api/auth/register',    publicLimiter);
app.post('/api/auth/resend-code', publicLimiter);
app.use('/api/auth', authRouter);
app.use('/api/ofertas', ofertasRouter);
app.use('/api/destinos', destinosRouter);
app.post('/api/cotizaciones', publicLimiter);
app.use('/api/cotizaciones', cotizacionesRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/users', usersRouter);
app.post('/api/newsletter/subscribe', publicLimiter);
app.use('/api/newsletter', newsletterRouter);

app.get('/health', (_, res) => res.json({ status: 'ok' }));

// Global JSON error handler — catches errors thrown by middleware or routes
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Error interno del servidor.' });
});

export default app;

if (process.env.NODE_ENV !== 'production' || process.env.LOCAL_SERVER) {
  const PORT = process.env.PORT || 4000;
  const server = app.listen(PORT, () => {
    console.log(`Backend corriendo en http://localhost:${PORT}`);
  });
  process.on('SIGTERM', () => server.close(() => process.exit(0)));
}
