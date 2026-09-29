import { Body, Controller, Post } from '@nestjs/common';
import { MercadoPagoService } from './mercadopago/mercadopago.service';
import { CreatePreferenceDto } from './dto/create-preference.dto';

@Controller('payments')
export class PaymentController {
  constructor(private readonly mercadoPagoService: MercadoPagoService) {}

  @Post('mercadopago/test')
  async testMercadoPago(@Body() body: CreatePreferenceDto) {
    const { items, payerEmail, externalReference } = body;

    const preference = await this.mercadoPagoService.createPreference({
      items,
      payerEmail: payerEmail || 'test_user@test.com',
      externalReference: externalReference || 'TEST_ORDER_' + Date.now(),
      // Opcional: puedes pasar URLs personalizadas si quieres
      // successUrl: 'http://localhost:5173/payment/success',
      // failureUrl: 'http://localhost:5173/payment/failure',
      // pendingUrl: 'http://localhost:5173/payment/pending',
    });
    return {
      preferenceId: preference.id,
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point,
    };
  }
}
