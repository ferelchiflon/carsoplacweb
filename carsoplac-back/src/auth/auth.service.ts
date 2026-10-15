import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from 'src/users/users.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<string> {
    const { username, email, password } = loginDto;
    const identifier = username ?? email;

    if (!identifier) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const user = await this.userService.findByIdentifier(identifier);
    if (!user) {
      // Generic error to avoid user enumeration
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      this.logger.warn(`Intento de login fallido para identifier: ${identifier}`);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.jwtService.sign({ sub: user.id, role: user.role });
  }

  async verifyToken(token: string): Promise<any | null> {
    try {
      return this.jwtService.verify(token);
    } catch {
      return null;
    }
  }
}
