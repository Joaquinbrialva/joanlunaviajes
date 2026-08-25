import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

function parsePostgresUrl(url) {
  // Replace scheme so WHATWG URL parses authority correctly
  const u = new URL(url.replace(/^[a-z][a-z0-9+\-.]*:\/\//, 'https://'));
  return {
    host: u.hostname,
    port: Number(u.port) || 5432,
    database: u.pathname.replace(/^\//, '').split('?')[0],
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
  };
}

// Supabase firma el certificado del pooler con su propia CA, así que la cadena
// no valida contra las CAs del sistema. Con DATABASE_CA_CERT (el contenido PEM
// del cert que se baja de Database Settings → SSL Configuration) verificamos de
// verdad; sin él la conexión sigue cifrada, pero no autenticamos al servidor.
function buildSslConfig() {
  const ca = process.env.DATABASE_CA_CERT;
  if (ca) {
    return { ca: ca.replace(/\\n/g, '\n'), rejectUnauthorized: true };
  }
  console.warn(
    '[db] DATABASE_CA_CERT no está configurada: la conexión va cifrada pero sin ' +
    'verificar el certificado del servidor (vulnerable a man-in-the-middle).'
  );
  return { rejectUnauthorized: false };
}

const pool = new pg.Pool({
  ...parsePostgresUrl(process.env.DATABASE_URL),
  ssl: buildSslConfig(),
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('[pg pool error]', err.message);
});

const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });

export async function withRetry(fn) {
  try {
    return await fn();
  } catch (err) {
    const msg = String(err?.message || '');
    const isConnError =
      msg.includes('ECONNRESET') ||
      msg.includes('Unable to open a connection') ||
      msg.includes('Connection refused') ||
      msg.includes('terminating connection') ||
      err?.code === 'P2024';
    if (!isConnError) throw err;
    await new Promise((r) => setTimeout(r, 400));
    return await fn();
  }
}
