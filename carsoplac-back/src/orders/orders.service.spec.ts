import { OrdersService } from './orders.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MercadoPagoService } from '../payments/mercadopago/mercadopago.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { CreateOrderDto } from './dto/create-order.dto';
import {
  MockDb,
  seedProduct,
  seedOrder,
  makeConfig,
  makeMp,
} from '../testing/stateful-prisma.mock';

describe('OrdersService', () => {
  let db: MockDb;
  let mp: ReturnType<typeof makeMp>;
  let service: OrdersService;

  const buildService = (configOverrides: Record<string, unknown> = {}) => {
    mp = makeMp();
    service = new OrdersService(
      db as unknown as PrismaService,
      mp as unknown as MercadoPagoService,
      makeConfig(configOverrides) as unknown as ConfigService,
    );
  };

  beforeEach(() => {
    db = new MockDb();
    buildService();
  });

  describe('create (reserva de stock en $transaction)', () => {
    it('rechaza una orden sin items', async () => {
      await expect(service.create({ items: [] } as CreateOrderDto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rechaza si el producto no existe', async () => {
      await expect(
        service.create({ items: [{ productId: 'inexistente', quantity: 1 }] } as CreateOrderDto),
      ).rejects.toThrow('Product with id inexistente not found');
    });

    it('reserva stock con updateMany condicional (gte), crea la orden PENDING con currency del entorno', async () => {
      seedProduct(db, { id: 'prod-a', name: 'Producto A', price: 10, stock: 5 });
      const before = Date.now();

      const result = await service.create({
        items: [{ productId: 'prod-a', quantity: 2 }],
        buyerEmail: 'guest@test.com',
      } as CreateOrderDto);

      // El stock se descuenta con la condición stock >= quantity
      expect(db.products.get('prod-a')!.stock).toBe(3);
      const order = db.orders.get(result.orderId)!;
      expect(order.status).toBe(OrderStatus.PENDING);
      expect(order.total).toBe(20);
      expect(order.currency).toBe('ARS'); // CURRENCY_ID del entorno, no default de schema
      expect(order.expiresAt.getTime()).toBeGreaterThan(before + 29 * 60 * 1000);
      expect(order.expiresAt.getTime()).toBeLessThan(before + 31 * 60 * 1000);
      expect(order.items[0]).toMatchObject({
        productId: 'prod-a',
        name: 'Producto A',
        quantity: 2,
        unitPrice: 10,
      });
      expect(order.preferenceId).toBe('pref-1');
      expect(result.initPoint).toBe('https://mp.test/init');
    });

    it('ordena los items por productId antes de reservar (evita deadlocks)', async () => {
      seedProduct(db, { id: 'prod-a', price: 10, stock: 5 });
      seedProduct(db, { id: 'prod-b', price: 5, stock: 5 });

      await service.create({
        items: [
          { productId: 'prod-b', quantity: 1 },
          { productId: 'prod-a', quantity: 1 },
        ],
      } as CreateOrderDto);

      expect(db.productUpdateOrderLog).toEqual(['prod-a', 'prod-b']);
    });

    it('rollback: stock insuficiente no descuenta ni crea la orden', async () => {
      seedProduct(db, { id: 'prod-a', price: 10, stock: 1 });

      await expect(
        service.create({ items: [{ productId: 'prod-a', quantity: 2 }] } as CreateOrderDto),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(db.products.get('prod-a')!.stock).toBe(1);
      expect(db.orders.size).toBe(0);
    });

    it('checkout con stock 1 y DOS pedidos simultáneos: uno falla, stock final 0, una sola orden', async () => {
      seedProduct(db, { id: 'prod-x', price: 10, stock: 1 });

      const results = await Promise.allSettled([
        service.create({ items: [{ productId: 'prod-x', quantity: 1 }] } as CreateOrderDto),
        service.create({ items: [{ productId: 'prod-x', quantity: 1 }] } as CreateOrderDto),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');
      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(BadRequestException);
      expect(db.products.get('prod-x')!.stock).toBe(0);
      expect(db.orders.size).toBe(1);
    });

    it('si falla la creación de la preferencia: cancela la orden y devuelve el stock', async () => {
      seedProduct(db, { id: 'prod-a', price: 10, stock: 5 });
      mp.createPreference.mockRejectedValueOnce(new Error('MP caído'));

      await expect(
        service.create({ items: [{ productId: 'prod-a', quantity: 2 }] } as CreateOrderDto),
      ).rejects.toBeInstanceOf(BadRequestException);

      const order = [...db.orders.values()][0];
      expect(order.status).toBe(OrderStatus.CANCELLED);
      expect(db.products.get('prod-a')!.stock).toBe(5);
    });

    it('guest checkout: sin userId no consulta el usuario ni lo asocia', async () => {
      seedProduct(db, { id: 'prod-a', price: 10, stock: 5 });

      await service.create({ items: [{ productId: 'prod-a', quantity: 1 }] } as CreateOrderDto);

      expect(db.users.size).toBe(0);
      const order = [...db.orders.values()][0];
      expect(order.userId).toBeNull();
    });

    it('con userId toma los datos del usuario logueado', async () => {
      db.users.set('user-1', { id: 'user-1', email: 'user@test.com', phone: '555-1', address: 'Av. Siempre Viva' });
      seedProduct(db, { id: 'prod-a', price: 10, stock: 5 });

      await service.create({ items: [{ productId: 'prod-a', quantity: 1 }] } as CreateOrderDto, 'user-1');

      const order = [...db.orders.values()][0];
      expect(order.userId).toBe('user-1');
      expect(order.buyerEmail).toBe('user@test.com');
    });
  });

  // __NEXT_CHUNK__
});
