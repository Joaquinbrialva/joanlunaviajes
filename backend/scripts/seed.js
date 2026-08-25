import bcrypt from 'bcryptjs';
import { prisma } from '../src/store/prisma.js';

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@joanlunaviajes.com';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';
const ADMIN_NAME = process.env.SEED_ADMIN_NAME || 'Admin Principal';

async function main() {
  const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { password: hashed, role: 'admin', verified: true },
    create: {
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: hashed,
      role: 'admin',
      verified: true,
    },
  });

  console.log(`Usuario admin listo: ${user.email} (id: ${user.id})`);
  console.log(`Contraseña: ${ADMIN_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error('Error al seedear admin:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
