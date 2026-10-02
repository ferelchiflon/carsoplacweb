// auth/auth.controller.ts
import {
  Body,
  Controller,
  Post,
  Res,
  HttpCode,
  UseGuards,
  //Req,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res() res: Response) {
    const token = await this.authService.login(dto.username, dto.password);

    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      // En producción el frontend (Vercel/local) y este backend (Render) viven
      // en dominios distintos: SameSite 'strict' haría que el navegador NUNCA
      // envíe la cookie en pedidos cross-site, rompiendo la sesión tras el login.
      // 'none' (requiere Secure, ya activo en producción) es lo correcto para
      // JWT cross-domain. En desarrollo (todo en localhost) 'strict' alcanza.
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 12 * 60 * 60 * 1000, // 12hs en milisegundos
    });

    return res.json({ message: 'Login exitoso' });
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  logout(@Res() res: Response) {
    res.clearCookie('jwt');
    return res.json({ message: 'Logout exitoso' });
  }

  //   @Post('change-password')
  //   @HttpCode(200)
  //   @UseGuards(AuthGuard)
  //   async changePassword(
  //     @Req() req: Request,
  //     @Res() res: Response,
  //     @Body() body: { currentPassword: string; newPassword: string },
  //   ) {
  //     const user = req['user'] as { sub: string };
  //     await this.authService.changePassword(
  //       user.sub,
  //       body.currentPassword,
  //       body.newPassword,
  //     );
  //     res.clearCookie('jwt');
  //     return res.json({
  //       message: 'Contraseña actualizada, volvé a iniciar sesión',
  //     });
  //   }
  @Get('me')
  @UseGuards(AuthGuard)
  async me(@Req() req: Request) {
    return req.user;
  }
}
