import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Request } from 'express';
import { AuthService } from 'src/auth/auth.service';
import { AuthenticatedRequest } from '../types/http';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService, private readonly authService: AuthService) {}

  @Post()
  async create(@Body() createOrderDto: CreateOrderDto, @Req() req: Request) {
    let userId: string | undefined;
    const token = req.cookies?.jwt;
    if (token) {
      const payload = await this.authService.verifyToken(token);
      if (payload?.sub) {
        userId = payload.sub;
      }
    }
    return this.ordersService.create(createOrderDto, userId);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @UseGuards(AuthGuard)
  @Get('mine')
  async findMine(@Req() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    return this.ordersService.findByUserId(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    let userId: string | undefined;
    if (req.user && req.user.sub) {
      userId = req.user.sub;
    }
    return this.ordersService.findOne(id, userId);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    // If user is admin, bypass ownership check
    if (req.user && req.user.role === 'ADMIN') {
      return this.ordersService.updateStatus(id, updateOrderStatusDto);
    }
    
    // For non-admin users, enforce ownership check
    const userId = req.user?.sub;
    return this.ordersService.updateStatus(id, updateOrderStatusDto, userId);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    // If user is admin, bypass ownership check
    if (req.user && req.user.role === 'ADMIN') {
      return this.ordersService.remove(id);
    }
    
    // For non-admin users, enforce ownership check
    const userId = req.user?.sub;
    return this.ordersService.remove(id, userId);
  }
}