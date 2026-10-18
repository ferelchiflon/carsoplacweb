import { Module } from '@nestjs/common';
import { PaymentController } from './payments.controller';
import { MercadoPagoClient } from './mercadopago/mercadopago.client';
import { MercadoPagoService } from './mercadopago/mercadopago.service';
import { AuthModule } from 'src/auth/auth.module';

// AuthModule: provee JwtService, necesario para el AuthGuard que usa
// PaymentController (mismo patrón que ProductsModule).
@Module({
  imports: [AuthModule],
  controllers: [PaymentController],
  providers: [MercadoPagoClient, MercadoPagoService],
})
export class PaymentsModule {}
