import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: { verifyAsync: jest.Mock };
  let reflector: { getAllAndOverride: jest.Mock };

  function contextWithHeaders(
    headers: Record<string, string>,
  ): ExecutionContext {
    const request: { headers: Record<string, string>; user?: unknown } = {
      headers,
    };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => undefined,
      getClass: () => undefined,
    } as unknown as ExecutionContext;
  }

  beforeEach(async () => {
    jwtService = { verifyAsync: jest.fn() };
    reflector = { getAllAndOverride: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        { provide: JwtService, useValue: jwtService },
        { provide: Reflector, useValue: reflector },
      ],
    }).compile();

    guard = module.get(JwtAuthGuard);
  });

  it('allows public routes without a token', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);

    await expect(guard.canActivate(contextWithHeaders({}))).resolves.toBe(true);
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('rejects when no Authorization header is present', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);

    await expect(
      guard.canActivate(contextWithHeaders({})),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects an invalid or expired token', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid'));

    await expect(
      guard.canActivate(
        contextWithHeaders({ authorization: 'Bearer bad-token' }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('allows a valid token and attaches the payload to the request', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const payload = { sub: 'user-1', isAdmin: false, canCreateParty: false };
    jwtService.verifyAsync.mockResolvedValue(payload);
    const context = contextWithHeaders({ authorization: 'Bearer good-token' });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(context.switchToHttp().getRequest().user).toEqual(payload);
  });
});
