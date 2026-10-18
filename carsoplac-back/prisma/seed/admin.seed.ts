// prisma/seed/admin.seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Logger } from '@nestjs/common';
import { assertExpectedDb } from '../../scripts/lib/guard';

require('dotenv').config();

const logger = new Logger('AdminSeed');

async function main() {
  // Aborta si DATABASE_URL no apunta a EXPECTED_DB (el .env local apunta a producción)
  assertExpectedDb();

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD;
  const adminResetPassword = process.env.ADMIN_RESET_PASSWORD === 'true';

  if (!adminEmail) throw new Error('ADMIN_EMAIL debe estar definida');
  if (!adminUsername) throw new Error('ADMIN_USERNAME debe estar definida');
  if (!adminPassword) throw new Error('ADMIN_INITIAL_PASSWORD debe estar definida');
  if (adminPassword.length < 12) {
    throw new Error('ADMIN_INITIAL_PASSWORD debe tener al menos 12 caracteres');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
    throw new Error('ADMIN_EMAIL debe ser una dirección de correo válida');
  }

  const prisma = new PrismaClient();
  try {
    const existing = await prisma.user.findUnique({ where: { username: adminUsername } });

    if (existing) {
      const data: { email?: string; password?: string } = {};
      if (existing.email !== adminEmail) data.email = adminEmail;
      if (adminResetPassword) data.password = await bcrypt.hash(adminPassword, 12);

      if (Object.keys(data).length > 0) {
        await prisma.user.update({ where: { username: adminUsername }, data });
        logger.log(`Admin '${adminUsername}' actualizado (${Object.keys(data).join(', ')})`);
      } else {
        logger.log(`Admin '${adminUsername}' ya existe, sin cambios`);
      }
    } else {
      await prisma.user.create({
        data: {
          username: adminUsername,
          email: adminEmail,
          password: await bcrypt.hash(adminPassword, 12),
          role: 'ADMIN',
        },
      });
      logger.log(`Admin '${adminUsername}' creado correctamente`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  logger.error(`Error en seed: ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});