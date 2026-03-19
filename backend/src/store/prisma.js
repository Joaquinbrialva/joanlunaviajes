import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Ejecuta fn() y reintenta una vez si la conexión con Supabase se cayó
 * (ECONNRESET / connection drop por idle timeout del pooler).
 */
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
      err?.code === 'P2024'; // Prisma: connection pool timeout
    if (!isConnError) throw err;
    // Reconectar y reintentar una vez
    try { await prisma.$disconnect(); } catch {}
    await new Promise((r) => setTimeout(r, 400));
    try { await prisma.$connect(); } catch {}
    return await fn();
  }
}
