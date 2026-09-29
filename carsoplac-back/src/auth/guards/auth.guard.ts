// auth/guards/auth.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

interface JwtPayload {
  sub: string;
  role: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) throw new UnauthorizedException('No autenticado');

    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      request['user'] = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  /**
   * Extrae el JWT desde dos fuentes posibles:
   * 1. Cookie httpOnly 'jwt' (usada por carsoplac-principal).
   * 2. Header 'Authorization: Bearer <token>' (usado por carsoplac-admin,
   *    que guarda el token en sessionStorage).
   *
   * Se prioriza la cookie por ser más resistente a XSS; si no existe,
   * se cae al header Bearer.
   */
  private extractToken(request: Request): string | undefined {
    const cookieToken = request.cookies?.['jwt'] as string | undefined;
    if (cookieToken) return cookieToken;

    const authHeader = request.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.slice('Bearer '.length).trim();
    }

    return undefined;
  }
}
