// Mock database implementation for testing
// Simula Prisma con Maps + undo log para rollback de $transaction.
export class MockDb {
  users: Map<string, any> = new Map();
  products: Map<string, any> = new Map();
  orders: Map<string, any> = new Map();
  paymentRecords: Map<string, any> = new Map();
  productUpdateOrderLog: string[] = [];
  user: any;
  product: any;
  order: any;
  paymentRecord: any;

  // Transaction state
  private transactionDepth = 0;
  private undoLogs: Array<{
    entity: keyof MockDb;
    id: string;
    operation: 'create' | 'update' | 'delete';
    data: any
  }> = [];

  constructor() {
    this.initializeMocks();
  }

  private initializeMocks() {
    this.user = {
      findUnique: this.makeFindUnique('users'),
      create: this.makeCreate('users'),
      update: this.makeUpdate('users'),
      delete: this.makeDelete('users'),
      findMany: this.makeFindMany('users'),
      count: this.makeCount('users'),
    };

    this.product = {
      findUnique: this.makeFindUnique('products'),
      create: this.makeCreate('products'),
      update: this.makeUpdate('products'),
      updateMany: this.makeUpdateMany('products'),
      delete: this.makeDelete('products'),
      findMany: this.makeFindMany('products'),
      count: this.makeCount('products'),
    };

    this.order = {
      findUnique: this.makeFindUnique('orders'),
      create: this.makeCreate('orders'),
      update: this.makeUpdate('orders'),
      updateMany: this.makeUpdateMany('orders'),
      delete: this.makeDelete('orders'),
      findMany: this.makeFindMany('orders'),
      count: this.makeCount('orders'),
    };

    this.paymentRecord = {
      findUnique: this.makeFindUnique('paymentRecords'),
      create: this.makeCreate('paymentRecords'),
      update: this.makeUpdate('paymentRecords'),
      upsert: this.makeUpsert('paymentRecords'),
      updateMany: this.makeUpdateMany('paymentRecords'),
      delete: this.makeDelete('paymentRecords'),
      findMany: this.makeFindMany('paymentRecords'),
      count: this.makeCount('paymentRecords'),
    };
  }

  clear() {
    this.users.clear();
    this.products.clear();
    this.orders.clear();
    this.paymentRecords.clear();
    this.productUpdateOrderLog = [];
    this.transactionDepth = 0;
    this.undoLogs = [];
  }

  $transaction<T>(fn: (tx: this) => Promise<T>): Promise<T> {
    this.transactionDepth++;
    try {
      const result = fn(this);
      return Promise.resolve(result).then(value => {
        this.transactionDepth--;
        if (this.transactionDepth === 0) {
          this.undoLogs = [];
        }
        return value;
      }).catch(error => {
        this.transactionDepth--;
        if (this.transactionDepth === 0) {
          // Rollback: aplicar undo log en orden inverso
          for (let i = this.undoLogs.length - 1; i >= 0; i--) {
            const log = this.undoLogs[i];
            const map = this[log.entity] as Map<string, any>;
            if (log.operation === 'create') {
              map.delete(log.id);
            } else if (log.operation === 'delete') {
              map.set(log.id, log.data);
            } else if (log.operation === 'update') {
              map.set(log.id, log.data);
            }
          }
          this.undoLogs = [];
        }
        throw error;
      });
    } catch (error) {
      this.transactionDepth--;
      if (this.transactionDepth === 0) {
        this.undoLogs = [];
      }
      throw error;
    }
  }

  $extends<O extends Record<string, any>>(extensions: O): this & O {
    return Object.assign(this, extensions) as this & O;
  }

  private makeFindUnique<T extends keyof MockDb>(entity: T) {
    return jest.fn(async (args: { where: { id: string } }) => {
      const map = (this as any)[entity] as Map<string, any>;
      return map.get(args.where.id) ?? null;
    });
  }

  private makeCreate<T extends keyof MockDb>(entity: T) {
    return jest.fn(async (args: { data: any }) => {
      const data = { ...args.data };
      // Prisma omite los campos undefined; en columnas nullable se leen como
      // null (el spec espera order.userId === null en guest checkout).
      for (const key of Object.keys(data)) {
        if (data[key] === undefined) data[key] = null;
      }
      if (!data.id) data.id = `${entity}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      (this as any)[entity].set(data.id, data);
      this.undoLogs.push({ entity, id: data.id, operation: 'create', data: null });
      return data;
    });
  }

  private makeUpdate<T extends keyof MockDb>(entity: T) {
    return jest.fn(async (args: { where: { id: string }; data: Partial<any> }) => {
      const id = args.where.id;
      const map = (this as any)[entity] as Map<string, any>;
      const current = map.get(id);
      if (!current) return null;

      const updated = { ...current, ...args.data };
      this.undoLogs.push({ entity, id, operation: 'update', data: current });
      map.set(id, updated);
      return updated;
    });
  }

  private makeDelete<T extends keyof MockDb>(entity: T) {
    return jest.fn(async (args: { where: { id: string } }) => {
      const id = args.where.id;
      const map = (this as any)[entity] as Map<string, any>;
      const current = map.get(id);
      if (!current) return null;

      map.delete(id);
      this.undoLogs.push({ entity, id, operation: 'delete', data: current });
      return current;
    });
  }

  private makeFindMany<T extends keyof MockDb>(entity: T) {
    return jest.fn(async () => {
      const map = (this as any)[entity] as Map<string, any>;
      return [...map.values()];
    });
  }

  private makeCount<T extends keyof MockDb>(entity: T) {
    return jest.fn(async () => {
      const map = (this as any)[entity] as Map<string, any>;
      return map.size;
    });
  }

  // Upsert por clave arbitraria (id, mpPaymentId, ...): el where de Prisma
  // puede usar cualquier campo unico, no solo id.
  private makeUpsert<T extends keyof MockDb>(entity: T) {
    return jest.fn(async (args: { where: Record<string, any>; update: any; create: any }) => {
      const map = (this as any)[entity] as Map<string, any>;
      const [key, value] = Object.entries(args.where)[0];
      for (const [id, row] of map.entries()) {
        if (row[key] === value) {
          const updated = { ...row, ...args.update };
          this.undoLogs.push({ entity, id, operation: 'update', data: row });
          map.set(id, updated);
          return updated;
        }
      }
      const data = { ...args.create };
      for (const k of Object.keys(data)) {
        if (data[k] === undefined) data[k] = null;
      }
      data[key] = value;
      if (!data.id) data.id = `${entity}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      map.set(data.id, data);
      this.undoLogs.push({ entity, id: data.id, operation: 'create', data: null });
      return data;
    });
  }


  // updateMany con filtros condicionales (stock: { gte }, status: { in }, ...).
  // Devuelve { count } y SOLO modifica filas que matchean; el log de productos
  // solo registra updates efectivos (count >= 1).
  private makeUpdateMany<T extends keyof MockDb>(entity: T) {
    return jest.fn(async (args: { where: any; data: any }) => {
      const map = (this as any)[entity] as Map<string, any>;
      let count = 0;
      for (const [id, row] of map.entries()) {
        if (!this.matchesWhere(row, args.where)) continue;
        const updated = this.applyData({ ...row }, args.data);
        this.undoLogs.push({ entity, id, operation: 'update', data: row });
        map.set(id, updated);
        count++;
        if (entity === 'products') this.productUpdateOrderLog.push(id);
      }
      return { count };
    });
  }

  private matchesWhere(row: any, where: any): boolean {
    return Object.entries(where).every(([key, cond]: [string, any]) => {
      if (cond !== null && typeof cond === 'object' && !Array.isArray(cond)) {
        if ('gte' in cond && !(row[key] >= cond.gte)) return false;
        if ('gt' in cond && !(row[key] > cond.gt)) return false;
        if ('lte' in cond && !(row[key] <= cond.lte)) return false;
        if ('lt' in cond && !(row[key] < cond.lt)) return false;
        if ('in' in cond && !cond.in.includes(row[key])) return false;
        return true;
      }
      return row[key] === cond;
    });
  }

  private applyData(row: any, data: any): any {
    for (const [key, value] of Object.entries(data)) {
      if (value !== null && typeof value === 'object') {
        if ('decrement' in (value as any)) row[key] = row[key] - (value as any).decrement;
        else if ('increment' in (value as any)) row[key] = row[key] + (value as any).increment;
      } else {
        row[key] = value;
      }
    }
    return row;
  }
}

// Helper functions
export function seedProduct(db: MockDb, product: any & { id?: string }): string {
  const id = product.id ?? `prod_${Date.now()}`;
  db.products.set(id, { id, ...product });
  return id;
}

export function seedOrder(db: MockDb, order: any & { id?: string }): string {
  const id = order.id ?? `order_${Date.now()}`;
  db.orders.set(id, { id, ...order });
  return id;
}

export function seedUser(db: MockDb, user: any & { id?: string }): string {
  const id = user.id ?? `user_${Date.now()}`;
  db.users.set(id, { id, ...user });
  return id;
}

export function makeConfig(overrides: Record<string, unknown> = {}) {
  const defaults: Record<string, unknown> = {
    JWT_SECRET: 'test-secret',
    MP_WEBHOOK_SECRET: 'test-webhook-secret',
    MP_ACCESS_TOKEN: 'test-token',
    CURRENCY_ID: 'ARS',
    RESERVATION_TTL_MINUTES: 30,
    REFUNDS_ENABLED: true,
    EXPIRATION_JOB_ENABLED: true,
    FRONTEND_URL: 'http://localhost:3000',
    BACKEND_PUBLIC_URL: 'http://localhost:3000',
  };
  const lookup = (key: string): { found: boolean; value?: unknown } => {
    if (key in overrides) return { found: true, value: overrides[key] };
    if (key in defaults) return { found: true, value: defaults[key] };
    return { found: false };
  };
  return {
    get: jest.fn((key: string, defaultValue?: unknown) => {
      const hit = lookup(key);
      if (hit.found) return hit.value;
      return defaultValue ?? null;
    }),
    getOrThrow: jest.fn((key: string) => {
      const hit = lookup(key);
      if (hit.found) return hit.value;
      throw new Error(`Missing config: ${key}`);
    }),
  };
}

export function makeMp() {
  return {
    createPreference: jest.fn().mockResolvedValue({
      id: 'pref-1',
      init_point: 'https://mp.test/init',
      sandbox_init_point: 'https://mp.test/sandbox',
    }),
    getPayment: jest.fn(),
    refundPayment: jest.fn(),
  };
}

