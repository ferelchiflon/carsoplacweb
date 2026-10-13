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

  @UseGuards(AuthGuard)
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
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  updateStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, updateOrderStatusDto);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }
}