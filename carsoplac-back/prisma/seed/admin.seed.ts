// prisma/seed/admin.seed.ts
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const logger = new Logger('AdminSeed');

async function main() {
  const configService = new ConfigService();

  // Password desde variable de entorno - NUNCA hardcoded ni vacío
  const adminPassword = configService.get<string>('ADMIN_SEED_PASSWORD');
  if (!adminPassword || adminPassword.length < 12) {
    throw new Error(
      "ADMIN_SEED_PASSWORD debe estar definida en .env y tener al menos 12 caracteres. Genera una con: node -e \"console.log(require('crypto').randomBytes(24).toString('base64'))\"",
    );
  }

  const adminUsername =
    configService.get<string>('ADMIN_SEED_USERNAME') || 'admin';

  const prisma = new PrismaClient();
  try {
    const hashed = await bcrypt.hash(adminPassword, 12);

    await prisma.user.upsert({
      where: { username: adminUsername },
      update: { password: hashed },
      create: {
        username: adminUsername,
        password: hashed,
        role: 'ADMIN',
      },
    });

    logger.log(`Admin '${adminUsername}' creado/actualizado correctamente`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  logger.error('Error en seed:', err);
  process.exit(1);
});
