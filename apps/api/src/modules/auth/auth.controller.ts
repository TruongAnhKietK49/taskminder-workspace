import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AUTH_REFRESH_TOKEN_COOKIE } from './constants/auth.constants';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedUser } from './types/authenticated-user.type';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.register(
      registerDto,
      this.getRequestContext(request),
    );

    this.setRefreshTokenCookie(
      response,
      result.refreshToken,
      result.refreshTokenExpiresAt,
    );

    return {
      success: true,
      message: 'Register successfully',
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(
      loginDto,
      this.getRequestContext(request),
    );

    this.setRefreshTokenCookie(
      response,
      result.refreshToken,
      result.refreshTokenExpiresAt,
    );

    return {
      success: true,
      message: 'Login successfully',
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = this.getRefreshTokenFromRequest(request);

    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const result = await this.authService.refresh(refreshToken);

    this.setRefreshTokenCookie(
      response,
      result.refreshToken,
      result.refreshTokenExpiresAt,
    );

    return {
      success: true,
      message: 'Refresh token successfully',
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = this.getRefreshTokenFromRequest(request);

    await this.authService.logout(refreshToken);

    this.clearRefreshTokenCookie(response);

    return {
      success: true,
      message: 'Logout successfully',
      data: null,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return {
      success: true,
      message: 'Get current user successfully',
      data: {
        user: this.authService.toUserResponse(user),
      },
    };
  }

  private getRequestContext(request: Request) {
    const userAgent = request.headers['user-agent'];
    const normalizedUserAgent = Array.isArray(userAgent)
      ? userAgent.join(' ')
      : userAgent;

    return {
      userAgent: normalizedUserAgent,
      ipAddress: request.ip,
    };
  }

  private setRefreshTokenCookie(
    response: Response,
    refreshToken: string,
    expiresAt: Date,
  ) {
    response.cookie(AUTH_REFRESH_TOKEN_COOKIE, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth',
      expires: expiresAt,
    });
  }

  private clearRefreshTokenCookie(response: Response) {
    response.clearCookie(AUTH_REFRESH_TOKEN_COOKIE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth',
    });
  }

  private getRefreshTokenFromRequest(request: Request) {
    const cookieHeader = request.headers.cookie;

    if (!cookieHeader) {
      return undefined;
    }

    const cookies = cookieHeader
      .split(';')
      .reduce<Record<string, string>>((result, cookie) => {
        const [rawName, ...rawValueParts] = cookie.trim().split('=');

        if (!rawName) {
          return result;
        }

        result[rawName] = decodeURIComponent(rawValueParts.join('='));

        return result;
      }, {});

    return cookies[AUTH_REFRESH_TOKEN_COOKIE];
  }
}
