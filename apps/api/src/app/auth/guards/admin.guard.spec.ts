import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminGuard } from './admin.guard';

describe('AdminGuard', () => {
  let guard: AdminGuard;
  let prisma: { user: { findUnique: jest.Mock } };

  function contextFor(user: unknown): ExecutionContext {
    return {
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as unknown as ExecutionContext;
  }

  beforeEach(async () => {
    prisma = { user: { findUnique: jest.fn() } };

    const module = await Test.createTestingModule({
      providers: [AdminGuard, { provide: PrismaService, useValue: prisma }],
    }).compile();

    guard = module.get(AdminGuard);
  });

  it('allows a user whose database row currently has isAdmin: true', async () => {
    prisma.user.findUnique.mockResolvedValue({ isAdmin: true });

    const allowed = await guard.canActivate(
      contextFor({ sub: 'user-1', isAdmin: true, canCreateParty: false }),
    );

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: { isAdmin: true },
    });
    expect(allowed).toBe(true);
  });

  it('rejects a user whose database row currently has isAdmin: false, even if their token claims otherwise', async () => {
    prisma.user.findUnique.mockResolvedValue({ isAdmin: false });

    await expect(
      guard.canActivate(
        contextFor({ sub: 'user-2', isAdmin: true, canCreateParty: false }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a user that no longer exists', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      guard.canActivate(
        contextFor({ sub: 'ghost', isAdmin: true, canCreateParty: false }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a guest token, which has no sub at all', async () => {
    await expect(
      guard.canActivate(
        contextFor({ role: 'guest', partyId: 'party-1', guestId: 'guest-1' }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
});
