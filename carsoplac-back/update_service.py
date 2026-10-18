import re

with open('src/orders/orders.service.ts', 'r') as f:
    content = f.read()

# Define the new confirmPayment method
new_method = '''  // Called from payment webhook when payment is approved
  async confirmPayment(orderId: string, paymentId: string) {
    return this.prisma.$transaction(async (tx) => {
      // Fetch the order to get the total and verify it exists
      const order = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new BadRequestException(`Order not found: ${orderId}`);
      }

      // Upsert PaymentRecord to ensure idempotency by mpPaymentId
      await tx.paymentRecord.upsert({
        where: { mpPaymentId: paymentId },
        update: {}, // No update needed if record already exists
        create: {
          mpPaymentId: paymentId,
          orderId: orderId,
          status: 'approved',
          amountCents: Math.round(order.total * 100), // Store amount in cents
          currency: order.currency,
        },
      });

      // Update order only if still PENDING (prevent double processing)
      const updateResult = await tx.order.updateMany({
        where: {
          id: orderId,
          status: OrderStatus.PENDING,
        },
        data: {
          status: OrderStatus.PAID,
          paymentId,
          paidAt: new Date(),
        },
      });

      // If no rows updated, order was already processed by another request
      if (updateResult.count === 0) {
        // Return current order state (may be PAID or other status)
        return order;
      }

      // Fetch and return updated order
      const updatedOrder = await tx.order.findUnique({
        where: { id: orderId },
      });
      return updatedOrder;
    });
  }
'''

# Replace the existing confirmPayment method (from the line with 'async confirmPayment' to the closing brace of the method)
# We'll use a regex that matches the method until the closing brace at the same indentation level.
# We assume the method is at indentation level 2 (two spaces) inside the class.
pattern = r'async confirmPayment\(orderId: string, paymentId: string\) \{[\s\S]*?\n\s*\}'
content = re.sub(pattern, new_method, content)

with open('src/orders/orders.service.ts', 'w') as f:
    f.write(content)
