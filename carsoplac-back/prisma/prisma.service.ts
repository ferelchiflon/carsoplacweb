import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor(configService: ConfigService) {
    const databaseUrl = configService.get<string>('DATABASE_URL');
    if (!databaseUrl) {
      throw new Error(
        'DATABASE_URL no está definida. Configúrala en .env con el formato: postgresql://USER:PASSWORD@HOST:PORT/DBNAME?schema=public',
      );
    }

    // Sanity check: nunca loggear la URL completa (puede contener password)
    super({
      datasources: {
        db: { url: databaseUrl },
      },
      log: ['warn', 'error'],
    });

    this.logger.log('PrismaService inicializado');
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Conexión a base de datos establecida');
  }
}
