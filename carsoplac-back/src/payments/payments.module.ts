import { Module, forwardRef } from '@nestjs/common';
import { PaymentController } from './payments.controller';
import { MercadoPagoClient} from './mercadopago/mercadopago.client';
import { MercadoPagoService} from './mercadopago/mercadopago.service';
import { OrdersModule } from '../orders/orders.module';

@Module({
  controllers: [PaymentController],
  providers: [MercadoPagoClient, MercadoPagoService],
  imports: [forwardRef(() => OrdersModule)],
  exports: [MercadoPagoService],
})
export class PaymentsModule {}
