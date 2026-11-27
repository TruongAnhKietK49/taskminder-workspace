import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import {
  RATE_LIMIT_METADATA_KEY,
  type RateLimitOptions,
} from '../decorators/rate-limit.decorator';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly store = new Map<string, RateLimitEntry>();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!options) {
      return true;
    }

    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const ip = request.ip ?? request.socket?.remoteAddress ?? 'unknown-client';
    const routeKey = `${request.method}:${request.baseUrl}${request.path}`;
    const bucketKey = `${routeKey}:${ip}`;

    const now = Date.now();
    this.pruneExpired(now);

    const existing = this.store.get(bucketKey);

    if (!existing || existing.resetAt <= now) {
      this.store.set(bucketKey, {
        count: 1,
        resetAt: now + options.windowMs,
      });
      response.setHeader('X-RateLimit-Limit', String(options.limit));
      response.setHeader(
        'X-RateLimit-Remaining',
        String(Math.max(0, options.limit - 1)),
      );
      return true;
    }

    if (existing.count >= options.limit) {
      const retryAfterSec = Math.max(
        1,
        Math.ceil((existing.resetAt - now) / 1000),
      );
      response.setHeader('X-RateLimit-Limit', String(options.limit));
      response.setHeader('X-RateLimit-Remaining', '0');
      response.setHeader('Retry-After', String(retryAfterSec));

      throw new HttpException(
        'Too many requests. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    existing.count += 1;
    response.setHeader('X-RateLimit-Limit', String(options.limit));
    response.setHeader(
      'X-RateLimit-Remaining',
      String(Math.max(0, options.limit - existing.count)),
    );

    return true;
  }

  private pruneExpired(now: number): void {
    if (this.store.size < 1000) {
      return;
    }

    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt <= now) {
        this.store.delete(key);
      }
    }
  }
}
