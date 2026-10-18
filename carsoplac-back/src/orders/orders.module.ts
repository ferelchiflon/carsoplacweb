import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaModule } from 'prisma/prisma.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [PrismaModule, PaymentsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}