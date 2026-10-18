import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UserService } from './users.service';
import { PrismaService } from 'prisma/prisma.service';

describe('UserService', () => {
  let service: UserService;

  const mockPrisma = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    userFavorite: {
      create: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  describe('createUser', () => {
    it('crea el usuario con los datos provistos', async () => {
      const data = {
        email: 'nuevo@test.com',
        username: 'nuevo@test.com',
        name: null,
        password: 'hashed-password',
        role: 'CUSTOMER' as const,
      };
      const created = { id: 'user-1', ...data };
      mockPrisma.user.create.mockResolvedValue(created);

      const result = await service.createUser(data);

      expect(result).toEqual(created);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({ data });
    });
  });

  describe('getProfile', () => {
    it('devuelve el perfil del usuario sin excluir password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'ana@test.com',
        username: 'ana@test.com',
        name: 'Ana',
        phone: null,
        address: null,
        role: 'CUSTOMER',
        createdAt: new Date(),
      });

      const result = await service.getProfile('user-1');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'user-1' } }),
      );
      expect(result).not.toHaveProperty('password');
    });

    it('lanza NotFoundException si el usuario no existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('no-existe')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addFavorite', () => {
    it('crea el registro UserFavorite (userId + productId), no usa connect', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        id: 'prod-1',
        name: 'Tornillo',
      });
      mockPrisma.userFavorite.create.mockResolvedValue({
        id: 'fav-1',
        userId: 'user-1',
        productId: 'prod-1',
      });
      mockPrisma.userFavorite.findMany.mockResolvedValue([
        { product: { id: 'prod-1', name: 'Tornillo' } },
      ]);

      const result = await service.addFavorite('user-1', 'prod-1');

      // Regresión: antes se usaba favorites.connect, que falla en m-n explícita
      expect(mockPrisma.userFavorite.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', productId: 'prod-1' },
      });
      expect(result).toEqual([{ id: 'prod-1', name: 'Tornillo' }]);
    });

    it('es idempotente si ya es favorito (P2002 unique)', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: 'prod-1' });
      const duplicateError = Object.assign(
        new Error('Unique constraint failed'),
        { code: 'P2002' },
      );
      mockPrisma.userFavorite.create.mockRejectedValue(duplicateError);
      mockPrisma.userFavorite.findMany.mockResolvedValue([
        { product: { id: 'prod-1' } },
      ]);

      await expect(service.addFavorite('user-1', 'prod-1')).resolves.toEqual([
        { id: 'prod-1' },
      ]);
    });

    it('relanza errores que no sean de duplicado', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: 'prod-1' });
      mockPrisma.userFavorite.create.mockRejectedValue(new Error('DB down'));

      await expect(service.addFavorite('user-1', 'prod-1')).rejects.toThrow(
        'DB down',
      );
    });

    it('lanza error si el producto no existe', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(
        service.addFavorite('user-1', 'no-existe'),
      ).rejects.toThrow('Producto no encontrado');
    });
  });

  describe('removeFavorite', () => {
    it('elimina con deleteMany y devuelve los favoritos restantes', async () => {
      mockPrisma.userFavorite.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.userFavorite.findMany.mockResolvedValue([]);

      const result = await service.removeFavorite('user-1', 'prod-1');

      expect(mockPrisma.userFavorite.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', productId: 'prod-1' },
      });
      expect(result).toEqual([]);
    });
  });

  describe('getFavorites', () => {
    it('devuelve los PRODUCTOS, no los registros de la tabla join', async () => {
      mockPrisma.userFavorite.findMany.mockResolvedValue([
        { id: 'fav-1', product: { id: 'prod-1', name: 'A' } },
        { id: 'fav-2', product: { id: 'prod-2', name: 'B' } },
      ]);

      const result = await service.getFavorites('user-1');

      expect(mockPrisma.userFavorite.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1' } }),
      );
      expect(result).toEqual([
        { id: 'prod-1', name: 'A' },
        { id: 'prod-2', name: 'B' },
      ]);
    });

    it('devuelve [] si el usuario no tiene favoritos', async () => {
      mockPrisma.userFavorite.findMany.mockResolvedValue([]);

      expect(await service.getFavorites('user-1')).toEqual([]);
    });
  });
});
