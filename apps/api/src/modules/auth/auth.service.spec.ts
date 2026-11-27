import { ConflictException, UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import type { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const mockUserFindUnique = jest.fn();
  const mockSessionFindUnique = jest.fn();

  const mockPrisma = {
    user: {
      findUnique: mockUserFindUnique,
      create: jest.fn(),
    },
    authSession: {
      findUnique: mockSessionFindUnique,
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockConfigService = {
    getOrThrow: jest.fn().mockReturnValue('test-secret'),
    get: jest.fn().mockReturnValue('15m'),
  };

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      mockPrisma as unknown as PrismaService,
      mockJwtService as unknown as JwtService,
      mockConfigService as unknown as ConfigService,
    );
  });

  it('throws ConflictException when registering an existing email', async () => {
    mockUserFindUnique.mockResolvedValue({ id: 'existing-user' });

    await expect(
      service.register(
        {
          email: 'taken@example.com',
          fullName: 'Taken User',
          password: 'Password123',
        },
        {},
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('throws UnauthorizedException when logging in with unknown email', async () => {
    mockUserFindUnique.mockResolvedValue(null);

    await expect(
      service.login(
        {
          email: 'missing@example.com',
          password: 'Password123',
        },
        {},
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when logging in to an inactive account', async () => {
    mockUserFindUnique.mockResolvedValue({
      id: 'u1',
      email: 'blocked@example.com',
      fullName: 'Blocked',
      avatarUrl: null,
      status: 'BLOCKED',
      passwordHash: 'hash',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      service.login(
        {
          email: 'blocked@example.com',
          password: 'Password123',
        },
        {},
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when refresh session is missing or revoked', async () => {
    mockJwtService.verifyAsync.mockResolvedValue({
      sub: 'u1',
      sid: 'sid-1',
      tokenType: 'refresh',
    });
    mockSessionFindUnique.mockResolvedValue(null);

    await expect(service.refresh('some-token')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
