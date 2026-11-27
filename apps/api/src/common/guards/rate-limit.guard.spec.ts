import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitGuard } from './rate-limit.guard';

describe('RateLimitGuard', () => {
  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  let guard: RateLimitGuard;

  function createMockContext(ip = '127.0.0.1') {
    const headers: Record<string, string> = {};
    const request = {
      ip,
      method: 'POST',
      baseUrl: '/api/auth',
      path: '/login',
      socket: { remoteAddress: ip },
    };
    const response = {
      setHeader: jest.fn((key: string, value: string) => {
        headers[key] = value;
      }),
    };

    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as unknown as ExecutionContext;

    return { context, headers };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new RateLimitGuard(mockReflector as unknown as Reflector);
  });

  it('allows requests when no rate limit metadata is set', () => {
    mockReflector.getAllAndOverride.mockReturnValue(undefined);
    const { context } = createMockContext();
    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows requests within the limit and throws 429 when exceeded', () => {
    mockReflector.getAllAndOverride.mockReturnValue({
      limit: 2,
      windowMs: 60_000,
    });

    const first = createMockContext('10.0.0.1');
    expect(guard.canActivate(first.context)).toBe(true);
    expect(first.headers['X-RateLimit-Remaining']).toBe('1');

    const second = createMockContext('10.0.0.1');
    expect(guard.canActivate(second.context)).toBe(true);
    expect(second.headers['X-RateLimit-Remaining']).toBe('0');

    const third = createMockContext('10.0.0.1');
    let caught: unknown;
    try {
      guard.canActivate(third.context);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(HttpException);
    expect((caught as HttpException).getStatus()).toBe(
      HttpStatus.TOO_MANY_REQUESTS,
    );
    expect(third.headers['Retry-After']).toBeDefined();
  });
});
