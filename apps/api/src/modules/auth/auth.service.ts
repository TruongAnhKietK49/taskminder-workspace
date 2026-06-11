import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { BCRYPT_SALT_ROUNDS } from './constants/auth.constants';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {
  AccessTokenPayload,
  RefreshTokenPayload,
} from './types/jwt-payload.type';
import { AuthenticatedUser } from './types/authenticated-user.type';

type JwtExpiresIn = number | `${number}${'s' | 'm' | 'h' | 'd'}`;

type RequestContext = {
  userAgent?: string;
  ipAddress?: string;
};

type SafeUser = AuthenticatedUser;

type AuthUserResponse = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type AuthSessionResult = {
  user: AuthUserResponse;
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
};

const USER_SELECT = {
  id: true,
  email: true,
  fullName: true,
  avatarUrl: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(
    registerDto: RegisterDto,
    context: RequestContext,
  ): Promise<AuthSessionResult> {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: registerDto.email,
      },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(
      registerDto.password,
      BCRYPT_SALT_ROUNDS,
    );

    try {
      const user = await this.prisma.user.create({
        data: {
          email: registerDto.email,
          fullName: registerDto.fullName,
          passwordHash,
        },
        select: USER_SELECT,
      });

      return this.createAuthSession(user, context);
    } catch (error) {
      if (this.isPrismaUniqueError(error)) {
        throw new ConflictException('Email is already registered');
      }

      throw error;
    }
  }

  async login(
    loginDto: LoginDto,
    context: RequestContext,
  ): Promise<AuthSessionResult> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: loginDto.email,
      },
      select: {
        ...USER_SELECT,
        passwordHash: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const safeUser: SafeUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return this.createAuthSession(safeUser, context);
  }

  async refresh(refreshToken: string): Promise<AuthSessionResult> {
    const payload = await this.verifyRefreshToken(refreshToken);

    const session = await this.prisma.authSession.findUnique({
      where: {
        id: payload.sid,
      },
      include: {
        user: {
          select: USER_SELECT,
        },
      },
    });

    if (
      !session ||
      session.userId !== payload.sub ||
      session.revokedAt ||
      session.expiresAt.getTime() <= Date.now()
    ) {
      throw new UnauthorizedException('Refresh session is invalid');
    }

    if (session.user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }

    const isRefreshTokenValid = await bcrypt.compare(
      refreshToken,
      session.refreshTokenHash,
    );

    if (!isRefreshTokenValid) {
      await this.revokeSession(session.id);

      throw new UnauthorizedException('Refresh token is invalid');
    }

    const refreshTokenExpiresAt = this.getRefreshTokenExpiresAt();
    const nextRefreshToken = await this.signRefreshToken(
      session.user.id,
      session.id,
    );

    const nextRefreshTokenHash = await bcrypt.hash(
      nextRefreshToken,
      BCRYPT_SALT_ROUNDS,
    );

    await this.prisma.authSession.update({
      where: {
        id: session.id,
      },
      data: {
        refreshTokenHash: nextRefreshTokenHash,
        expiresAt: refreshTokenExpiresAt,
      },
    });

    const accessToken = await this.signAccessToken(session.user);

    return {
      user: this.toUserResponse(session.user),
      accessToken,
      refreshToken: nextRefreshToken,
      refreshTokenExpiresAt,
    };
  }

  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) {
      return;
    }

    try {
      const payload = await this.verifyRefreshToken(refreshToken);

      await this.prisma.authSession.updateMany({
        where: {
          id: payload.sid,
          userId: payload.sub,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    } catch {
      // Logout should be idempotent.
      // Even if refresh token is expired/invalid, controller still clears cookie.
    }
  }

  toUserResponse(user: SafeUser): AuthUserResponse {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  private async createAuthSession(
    user: SafeUser,
    context: RequestContext,
  ): Promise<AuthSessionResult> {
    const sessionId = randomUUID();
    const refreshTokenExpiresAt = this.getRefreshTokenExpiresAt();

    const accessToken = await this.signAccessToken(user);
    const refreshToken = await this.signRefreshToken(user.id, sessionId);

    const refreshTokenHash = await bcrypt.hash(
      refreshToken,
      BCRYPT_SALT_ROUNDS,
    );

    await this.prisma.authSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        refreshTokenHash,
        userAgent: context.userAgent,
        ipAddress: context.ipAddress,
        expiresAt: refreshTokenExpiresAt,
      },
    });

    return {
      user: this.toUserResponse(user),
      accessToken,
      refreshToken,
      refreshTokenExpiresAt,
    };
  }

  private async signAccessToken(user: Pick<SafeUser, 'id' | 'email'>) {
    const payload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      tokenType: 'access',
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.getJwtExpiresIn('JWT_ACCESS_EXPIRES_IN', '15m'),
    });
  }

  private async signRefreshToken(userId: string, sessionId: string) {
    const payload: RefreshTokenPayload = {
      sub: userId,
      sid: sessionId,
      tokenType: 'refresh',
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.getJwtExpiresIn('JWT_REFRESH_EXPIRES_IN', '7d'),
    });
  }

  private async verifyRefreshToken(
    refreshToken: string,
  ): Promise<RefreshTokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        },
      );

      if (payload.tokenType !== 'refresh' || !payload.sub || !payload.sid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async revokeSession(sessionId: string) {
    await this.prisma.authSession.updateMany({
      where: {
        id: sessionId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  private getRefreshTokenExpiresAt() {
    const expiresIn = this.getJwtExpiresIn('JWT_REFRESH_EXPIRES_IN', '7d');

    return new Date(Date.now() + this.jwtExpiresInToMs(expiresIn));
  }

  private getJwtExpiresIn(
    configKey: string,
    fallback: JwtExpiresIn,
  ): JwtExpiresIn {
    const value = this.configService.get<string>(configKey);

    if (!value) {
      return fallback;
    }

    if (/^\d+$/.test(value)) {
      return Number(value);
    }

    if (/^\d+[smhd]$/.test(value)) {
      return value as JwtExpiresIn;
    }

    return fallback;
  }

  private jwtExpiresInToMs(expiresIn: JwtExpiresIn) {
    if (typeof expiresIn === 'number') {
      return expiresIn * 1000;
    }

    const value = Number(expiresIn.slice(0, -1));
    const unit = expiresIn.slice(-1);

    const multiplierMap: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return value * multiplierMap[unit];
  }

  private isPrismaUniqueError(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
  }
}
