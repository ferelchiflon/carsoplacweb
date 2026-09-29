import { Module } from '@nestjs/common';
import { PaymentController } from './payments.controller';
import { MercadoPagoClient } from './mercadopago/mercadopago.client';
import { MercadoPagoService } from './mercadopago/mercadopago.service';

@Module({
  controllers: [PaymentController],
  providers: [MercadoPagoClient, MercadoPagoService],
})
export class PaymentsModule {}
