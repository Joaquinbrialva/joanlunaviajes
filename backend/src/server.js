import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import authRouter from './routes/auth.js';
import ofertasRouter from './routes/ofertas.js';
import destinosRouter from './routes/destinos.js';
import cotizacionesRouter from './routes/cotizaciones.js';
import uploadRouter from './routes/upload.js';
import notificationsRouter from './routes/notifications.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Serve uploaded files as static assets
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRouter);
app.use('/api/ofertas', ofertasRouter);
app.use('/api/destinos', destinosRouter);
app.use('/api/cotizaciones', cotizacionesRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/notifications', notificationsRouter);

app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`);
});
