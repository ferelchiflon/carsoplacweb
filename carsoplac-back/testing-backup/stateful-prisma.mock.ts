// Mock database implementation for testing
export class MockDb {
  users: Map<string, any> = new Map();
  products: Map<string, any> = new Map();
  orders: Map<string, any> = new Map();
  paymentRecords: Map<string, any> = new Map();
  productUpdateOrderLog: string[] = [];
  
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
    // User methods
    this.user = {
      findUnique: this.makeFindUnique('users'),
      create: this.makeCreate('users'),
      update: this.makeUpdate('users'),
      delete: this.makeDelete('users'),
      findMany: this.makeFindMany('users'),
      count: this.makeCount('users'),
    };
    
    // Product methods
    this.product = {
      findUnique: this.makeFindUnique('products'),
      create: this.makeCreate('products'),
      update: this.makeUpdate('products'),
      updateMany: this.makeUpdateMany('products'),
      delete: this.makeDelete('products'),
      findMany: this.makeFindMany('products'),
      count: this.makeCount('products'),
    };
    
    // Order methods
    this.order = {
      findUnique: this.makeFindUnique('orders'),
      create: this.makeCreate('orders'),
      update: this.makeUpdate('orders'),
      updateMany: this.makeUpdateMany('orders'),
      delete: this.makeDelete('orders'),
      findMany: this.makeFindMany('orders'),
      count: this.makeCount('orders'),
    };
    
    // PaymentRecord methods
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
          // Commit: clear undo log
          this.undoLogs = [];
        }
        return value;
      }).catch(error => {
        this.transactionDepth--;
        if (this.transactionDepth === 0) {
          // Rollback: apply undo log in reverse order
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
  
  // Mock method factories
  private makeFindUnique<T extends keyof MockDb>(entity: T) {
    return jest.fn(async (args: { where: { id: string } }) => {
      const map = (this as any)[entity] as Map<string, any>;
      return map.get(args.where.id) ?? null;
    });
  }
  
  private makeCreate<T extends keyof MockDb>(entity: T) {
    return jest.fn(async (args: { data: any }) => {
      const data = { ...args.data };
      if (!data.id) data.id = `${entity}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      (this as any)[entity].set(data.id, data);
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
      return current;
    });
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

export function makeConfig() {
  return {
    get: jest.fn((key: string) => {
      const defaults: any = {
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
      return defaults[key] ?? null;
    }),
    getOrThrow: jest.fn((key: string) => {
      const defaults: any = {
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
      if (defaults[key] === undefined) throw new Error(`Missing config: ${key}`);
      return defaults[key];
    }),
  };
}

export function makeMp() {
  return {
    createPreference: jest.fn(),
    getPayment: jest.fn(),
    refundPayment: jest.fn(),
  };
}

export const MockDbImpl = MockDb;