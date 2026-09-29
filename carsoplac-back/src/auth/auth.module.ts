import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret || secret.length < 32) {
          throw new Error(
            'JWT_SECRET debe estar definido y tener al menos 32 caracteres. Define uno seguro en .env (ej: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))")',
          );
        }
        return {
          secret,
          signOptions: {
            // Cast a any necesario por incompatibilidad de tipos entre
            // @nestjs/jwt (que acepta string literal tipo '12h') y
            // jsonwebtoken (que acepta StringValue del paquete ms).
            expiresIn: (configService.get<string>('JWT_EXPIRES_IN') ||
              '12h') as any,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
