import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  app.use(cookieParser());

  // CORS estricto: solo orígenes explícitos desde env (no usar origin:true)
  const corsOrigins = (configService.get<string>('CORS_ORIGINS') || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  if (corsOrigins.length === 0) {
    logger.warn(
      'CORS_ORIGINS no configurado. Defínelo en .env con la lista de orígenes permitidos separados por coma. Sin orígenes en whitelist, navegadores serán rechazados.',
    );
  }

  app.enableCors({
    origin: ((
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Permitir requests sin origin solo en herramientas locales (Postman, curl)
      // NO en navegadores. Para producción, exigir origen en whitelist.
      if (!origin) return callback(null, true);
      if (corsOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`Origen ${origin} no permitido por CORS`));
    }) as unknown as boolean | string | string[],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(`Server running on port ${port}`);
}
void bootstrap();
