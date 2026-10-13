// prisma/seed/admin.seed.ts
import { Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
require('dotenv').config();

const logger = new Logger('AdminSeed');

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD;
  const adminResetPassword = process.env.ADMIN_RESET_PASSWORD === 'true';

  if (!adminEmail) {
    throw new Error('ADMIN_EMAIL debe estar definida en .env');
  }
  if (!adminUsername) {
    throw new Error('ADMIN_USERNAME debe estar definida en .env');
  }
  if (!adminPassword) {
    throw new Error('ADMIN_INITIAL_PASSWORD debe estar definida en .env');
  }
  if (adminPassword.length < 12) {
    throw new Error('ADMIN_INITIAL_PASSWORD debe tener al menos 12 caracteres');
  }
  // Optional: validate email format (basic)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(adminEmail)) {
    throw new Error('ADMIN_EMAIL debe ser una dirección de correo electrónico válida');
  }

  const prisma = new PrismaClient();
  try {
    const hashed = await bcrypt.hash(adminPassword, 12);

    const existingAdmin = await prisma.user.findUnique({
      where: { username: adminUsername },
    });

    if (existingAdmin) {
      // Admin already exists
      if (adminResetPassword) {
        // Update password only if ADMIN_RESET_PASSWORD is true
        await prisma.user.update({
          where: { username: adminUsername },
          data: {
            password: hashed,
          },
        });
        logger.log(`Admin '${adminUsername}' password reseteado`);
      } else {
        logger.log(`Admin '${adminUsername}' ya existe`);
      }
    } else {
      // Create new admin
      await prisma.user.create({
        data: {
          username: adminUsername,
          password: hashed,
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
  logger.error('Error en seed:', err);
  process.exit(1);
});
