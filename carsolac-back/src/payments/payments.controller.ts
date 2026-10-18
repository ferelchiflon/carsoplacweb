  @Post('webhook')
  async mercadopagoWebhook(@Req() req: Request) {
    let rawBody = '';
    try {
      for await (const chunk of req) {
        rawBody += chunk;
      }
    } catch (error) {
      console.error('Error reading raw body:', error);
      return { received: false };
    }

    const signature = req.headers['x-signature'] as string;
    if (!signature) {
      console.warn('Missing x-signature header');
      return { received: false };
    }

    const secret = this.configService.getOrThrow('MP_WEBHOOK_SECRET');
    const hmac = createHmac('sha256', secret);
    hmac.update(rawBody);
    const hash = hmac.digest('hex');

    if (hash !== signature) {
      console.warn('Invalid signature');
      return { received: false };
    }

    // Parse the body as JSON
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch (error) {
      console.error('Error parsing JSON body:', error);
      return { received: false };
    }

    // Then process the event as before
    const { type, data } = body;
    if (type === 'payment' && data?.id) {
      const paymentId = data.id;
      const payment = await this.mercadopagoSvc.getPayment(paymentId);
      // payment.status can be 'approved', 'pending', 'rejected', etc.
      if (payment.status === 'approved') {
        // Find order by preferenceId (external_reference)
        const externalReference = payment.external_reference;
        if (externalReference) {
          // Update order to PAID and set paymentId
          await this.ordersService.confirmPayment(externalReference, paymentId);
          // Optionally log
          console.log(`Payment approved for order ${externalReference}`);
        } else {
          console.warn('Payment approved but missing external_reference');
        }
      } else {
        // Payment not approved (pending, rejected, etc.)
        // Optionally update order status to something else? We'll just log.
        console.log(`Payment ${paymentId} status: ${payment.status}`);
      }
    }
    // Always respond 200 to avoid retries
    return { received: true };
  }