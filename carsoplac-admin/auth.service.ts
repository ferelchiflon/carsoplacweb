import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async login(username: string, password: string): Promise<string> {
    //Busco user
    const user = await this.userService.findByUsername(username);
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    //Comparo pass
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new UnauthorizedException('Credenciales inválidas');

    //Genero JWT
    return this.jwtService.sign({ sub: user.id, role: user.role });
  }
}
