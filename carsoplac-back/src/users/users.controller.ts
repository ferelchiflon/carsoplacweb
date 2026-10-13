import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserService } from './users.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { Request } from 'express';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthenticatedRequest } from '../types/http';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UserService) { }

  /** Perfil del usuario autenticado (consumido por MiCuenta). */
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('me')
  async getProfile(@Req() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    return this.usersService.getProfile(userId);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('me')
  async updateProfile(@Req() req: AuthenticatedRequest, @Body() dto: UpdateProfileDto) {
    const userId = req.user.sub;
    return this.usersService.updateProfile(userId, dto);
  }

  @UseGuards(AuthGuard)
  @Get('me/favorites')
  async getFavorites(@Req() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    return this.usersService.getFavorites(userId);
  }

  @UseGuards(AuthGuard)
  @Post('me/favorites/:productId')
  async addFavorite(@Req() req: AuthenticatedRequest, @Param('productId') productId: string) {
    const userId = req.user.sub;
    return this.usersService.addFavorite(userId, productId);
  }

  @UseGuards(AuthGuard)
  @Delete('me/favorites/:productId')
  async removeFavorite(@Req() req: AuthenticatedRequest, @Param('productId') productId: string) {
    const userId = req.user.sub;
    return this.usersService.removeFavorite(userId, productId);
  }
}