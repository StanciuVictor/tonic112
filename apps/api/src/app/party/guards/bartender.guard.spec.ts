import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PartyMemberRole } from '../../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BartenderGuard } from './bartender.guard';

describe('BartenderGuard', () => {
  let guard: BartenderGuard;
  let prisma: {
    party: { findFirst: jest.Mock };
    partyMember: { findUnique: jest.Mock };
  };

  const dbParty = { id: 'party-1', code: 'ABC234', qrToken: 'qr-token' };

  function contextFor(
    user: unknown,
    params: Record<string, string>,
  ): ExecutionContext {
    return {
      switchToHttp: () => ({ getRequest: () => ({ user, params }) }),
    } as unknown as ExecutionContext;
  }

  beforeEach(async () => {
    prisma = {
      party: { findFirst: jest.fn() },
      partyMember: { findUnique: jest.fn() },
    };

    const module = await Test.createTestingModule({
      providers: [BartenderGuard, { provide: PrismaService, useValue: prisma }],
    }).compile();

    guard = module.get(BartenderGuard);
  });

  it('allows a bartender for the party', async () => {
    prisma.party.findFirst.mockResolvedValue(dbParty);
    prisma.partyMember.findUnique.mockResolvedValue({
      role: PartyMemberRole.bartender,
    });

    const allowed = await guard.canActivate(
      contextFor(
        { sub: 'user-1', isAdmin: false, canCreateParty: false },
        { code: 'ABC234' },
      ),
    );

    expect(allowed).toBe(true);
  });

  it('rejects a customer participant', async () => {
    prisma.party.findFirst.mockResolvedValue(dbParty);
    prisma.partyMember.findUnique.mockResolvedValue({
      role: PartyMemberRole.customer,
    });

    await expect(
      guard.canActivate(
        contextFor(
          { sub: 'user-2', isAdmin: false, canCreateParty: false },
          { code: 'ABC234' },
        ),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects someone who never joined the party', async () => {
    prisma.party.findFirst.mockResolvedValue(dbParty);
    prisma.partyMember.findUnique.mockResolvedValue(null);

    await expect(
      guard.canActivate(
        contextFor(
          { sub: 'stranger', isAdmin: false, canCreateParty: false },
          { code: 'ABC234' },
        ),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows a canCreateParty holder promoting themselves, even as a customer', async () => {
    prisma.party.findFirst.mockResolvedValue(dbParty);
    prisma.partyMember.findUnique.mockResolvedValue({
      role: PartyMemberRole.customer,
    });

    const allowed = await guard.canActivate(
      contextFor(
        { sub: 'user-2', isAdmin: false, canCreateParty: true },
        { code: 'ABC234', userId: 'user-2' },
      ),
    );

    expect(allowed).toBe(true);
  });

  it('does not let a canCreateParty holder promote someone else', async () => {
    prisma.party.findFirst.mockResolvedValue(dbParty);
    prisma.partyMember.findUnique.mockResolvedValue({
      role: PartyMemberRole.customer,
    });

    await expect(
      guard.canActivate(
        contextFor(
          { sub: 'user-2', isAdmin: false, canCreateParty: true },
          { code: 'ABC234', userId: 'user-3' },
        ),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws NotFoundException for an unknown code', async () => {
    prisma.party.findFirst.mockResolvedValue(null);

    await expect(
      guard.canActivate(
        contextFor(
          { sub: 'user-1', isAdmin: false, canCreateParty: false },
          { code: 'NOPE12' },
        ),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
