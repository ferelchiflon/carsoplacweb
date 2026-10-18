import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UserService } from 'src/users/users.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;

  const mockUserService = {
    findByEmail: jest.fn(),
    createUser: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('token-jwt'),
    verify: jest.fn(),
  };

  const mockUser = {
    id: 'user-1',
    email: 'ana@test.com',
    username: 'ana@test.com',
    name: 'Ana',
    password: 'hashed-password',
    role: 'CUSTOMER',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('devuelve un token con credenciales válidas (busca por email)', async () => {
      mockUserService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const token = await service.login('ana@test.com', 'secreto123');

      expect(token).toBe('token-jwt');
      expect(mockUserService.findByEmail).toHaveBeenCalledWith('ana@test.com');
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        role: mockUser.role,
      });
    });

    it('rechaza si el usuario no existe', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login('nadie@test.com', 'secreto123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rechaza con contraseña inválida', async () => {
      mockUserService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login('ana@test.com', 'mala')).rejects.toThrow(
        'Credenciales inválidas',
      );
    });
  });

  describe('register', () => {
    it('crea el usuario con password hasheado, role CUSTOMER y no devuelve password', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-nueva');
      mockUserService.createUser.mockResolvedValue({
        ...mockUser,
        password: 'hashed-nueva',
      });

      const result = await service.register({
        email: 'ana@test.com',
        password: 'secreto123',
        name: 'Ana',
      });

      expect(mockUserService.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'ana@test.com',
          username: 'ana@test.com',
          name: 'Ana',
          password: 'hashed-nueva',
          role: 'CUSTOMER',
        }),
      );
      expect((bcrypt.hash as jest.Mock).mock.calls[0][1]).toBe(10); // salt rounds
      expect(result).not.toHaveProperty('password');
    });

    it('rechaza si el email ya está registrado', async () => {
      mockUserService.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.register({ email: 'ana@test.com', password: 'secreto123' }),
      ).rejects.toThrow('El email ya está registrado');
      expect(mockUserService.createUser).not.toHaveBeenCalled();
    });
  });

  describe('generateToken', () => {
    it('firma sub y role del usuario', () => {
      const token = service.generateToken(mockUser);

      expect(token).toBe('token-jwt');
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        role: 'CUSTOMER',
      });
    });
  });

  describe('verifyToken', () => {
    it('devuelve el payload si el token es válido', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'user-1', role: 'CUSTOMER' });

      await expect(service.verifyToken('token-valido')).resolves.toEqual({
        sub: 'user-1',
        role: 'CUSTOMER',
      });
    });

    it('devuelve null si el token es inválido', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('jwt malformed');
      });

      await expect(service.verifyToken('token-invalido')).resolves.toBeNull();
    });
  });
});
