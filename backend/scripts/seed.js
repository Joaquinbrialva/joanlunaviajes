import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ADMIN_NAME = 'Administrador';
const ADMIN_EMAIL = 'admin@joanlunaviajes.com';
const ADMIN_PASSWORD = 'CambiarPassword123!';

const CLIENT_NAME = 'Cliente Demo';
const CLIENT_EMAIL = 'cliente@test.com';
const CLIENT_PASSWORD = 'Cliente123!';
const CLIENT_PHONE = '+54 9 11 1234-5678';

async function main() {
  // Admin
  const existingAdmin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (existingAdmin) {
    console.log(`Usuario admin ya existe: ${ADMIN_EMAIL}`);
  } else {
    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await prisma.user.create({
      data: { name: ADMIN_NAME, email: ADMIN_EMAIL, phone: '', password: hashed, role: 'admin' },
    });
    console.log('✓ Usuario admin creado:');
    console.log(`  Email:      ${ADMIN_EMAIL}`);
    console.log(`  Contraseña: ${ADMIN_PASSWORD}`);
    console.log('  → Cambiá la contraseña después del primer login.');
  }

  // Cliente de prueba
  const existingClient = await prisma.user.findUnique({ where: { email: CLIENT_EMAIL } });
  if (existingClient) {
    console.log(`Usuario cliente ya existe: ${CLIENT_EMAIL}`);
  } else {
    const hashed = await bcrypt.hash(CLIENT_PASSWORD, 10);
    await prisma.user.create({
      data: { name: CLIENT_NAME, email: CLIENT_EMAIL, phone: CLIENT_PHONE, password: hashed, role: 'client' },
    });
    console.log('✓ Usuario cliente de prueba creado:');
    console.log(`  Email:      ${CLIENT_EMAIL}`);
    console.log(`  Contraseña: ${CLIENT_PASSWORD}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
