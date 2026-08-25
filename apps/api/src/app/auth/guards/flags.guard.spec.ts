import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { FlagsGuard } from './flags.guard';

describe('FlagsGuard', () => {
  let guard: FlagsGuard;
  let reflector: { getAllAndOverride: jest.Mock };

  function contextWithUser(user: unknown): ExecutionContext {
    return {
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
      getHandler: () => undefined,
      getClass: () => undefined,
    } as unknown as ExecutionContext;
  }

  beforeEach(async () => {
    reflector = { getAllAndOverride: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [FlagsGuard, { provide: Reflector, useValue: reflector }],
    }).compile();

    guard = module.get(FlagsGuard);
  });

  it('allows the request when the route requires no flags', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(contextWithUser({ isAdmin: false }))).toBe(true);
  });

  it('allows the request when the user has every required flag', () => {
    reflector.getAllAndOverride.mockReturnValue(['isAdmin']);

    expect(
      guard.canActivate(
        contextWithUser({ isAdmin: true, canCreateParty: false }),
      ),
    ).toBe(true);
  });

  it('rejects when the user is missing a required flag', () => {
    reflector.getAllAndOverride.mockReturnValue(['isAdmin']);

    expect(() =>
      guard.canActivate(
        contextWithUser({ isAdmin: false, canCreateParty: true }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('rejects when there is no authenticated user on the request', () => {
    reflector.getAllAndOverride.mockReturnValue(['canCreateParty']);

    expect(() => guard.canActivate(contextWithUser(undefined))).toThrow(
      ForbiddenException,
    );
  });
});
