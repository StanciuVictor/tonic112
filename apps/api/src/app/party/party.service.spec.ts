import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { AuthRole } from '../auth/interfaces/auth-role';
import {
  PartyMemberRole,
  PartyStatus,
  Prisma,
} from '../../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PartyService } from './party.service';

function uniqueConstraintError(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError(
    'Unique constraint failed on the fields: (`code`)',
    { code: 'P2002', clientVersion: '7.9.1' },
  );
}

describe('PartyService', () => {
  let service: PartyService;
  let prisma: {
    $transaction: jest.Mock;
    party: { findFirst: jest.Mock; update: jest.Mock };
    partyGuest: { create: jest.Mock; findMany: jest.Mock };
    partyMember: {
      upsert: jest.Mock;
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      delete: jest.Mock;
    };
  };
  let jwtService: { sign: jest.Mock };
  let tx: {
    party: { create: jest.Mock; update: jest.Mock };
    partyMember: { create: jest.Mock; deleteMany: jest.Mock };
    partyGuest: { deleteMany: jest.Mock };
  };

  const dbParty = {
    id: 'party-1',
    code: 'ABC234',
    qrToken: 'qr-token-value',
    status: PartyStatus.active,
    createdByUserId: 'user-1',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    startedAt: new Date('2026-01-01T00:00:00Z'),
    endedAt: null,
  };

  beforeEach(async () => {
    process.env.WEB_BASE_URL = 'https://example.test';

    tx = {
      party: {
        create: jest.fn().mockResolvedValue(dbParty),
        update: jest.fn(),
      },
      partyMember: {
        create: jest.fn().mockResolvedValue({}),
        deleteMany: jest.fn(),
      },
      partyGuest: { deleteMany: jest.fn() },
    };
    prisma = {
      $transaction: jest.fn((cb) => cb(tx)),
      party: { findFirst: jest.fn(), update: jest.fn() },
      partyGuest: { create: jest.fn(), findMany: jest.fn() },
      partyMember: {
        upsert: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        delete: jest.fn(),
      },
    };
    jwtService = { sign: jest.fn().mockReturnValue('signed-guest-jwt') };

    const module = await Test.createTestingModule({
      providers: [
        PartyService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get(PartyService);
  });

  describe('create', () => {
    it('creates a party and a bartender PartyMember row for the creator, in one transaction', async () => {
      const result = await service.create('user-1');

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(tx.party.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ createdByUserId: 'user-1' }),
      });
      expect(tx.partyMember.create).toHaveBeenCalledWith({
        data: {
          partyId: dbParty.id,
          userId: 'user-1',
          role: PartyMemberRole.bartender,
        },
      });
      expect(result).toEqual({
        id: dbParty.id,
        code: dbParty.code,
        status: dbParty.status,
        createdByUserId: dbParty.createdByUserId,
        createdAt: dbParty.createdAt.toISOString(),
        startedAt: dbParty.startedAt.toISOString(),
        endedAt: null,
        joinUrl: `https://example.test/join?code=${dbParty.qrToken}`,
      });
    });

    it('generates a different code and qrToken on every call', async () => {
      await service.create('user-1');
      const first = tx.party.create.mock.calls[0][0].data;
      await service.create('user-1');
      const second = tx.party.create.mock.calls[1][0].data;

      expect(first.code).not.toBe(second.code);
      expect(first.qrToken).not.toBe(second.qrToken);
    });

    it('retries with a fresh code after a unique-constraint collision', async () => {
      prisma.$transaction
        .mockImplementationOnce(() => Promise.reject(uniqueConstraintError()))
        .mockImplementationOnce((cb) => cb(tx));

      const result = await service.create('user-1');

      expect(prisma.$transaction).toHaveBeenCalledTimes(2);
      expect(result.id).toBe(dbParty.id);
    });

    it('gives up after repeated unique-constraint collisions', async () => {
      prisma.$transaction.mockImplementation(() =>
        Promise.reject(uniqueConstraintError()),
      );

      await expect(service.create('user-1')).rejects.toThrow();
      expect(prisma.$transaction).toHaveBeenCalledTimes(5);
    });

    it('does not retry or swallow unrelated errors', async () => {
      const dbError = new Error('connection lost');
      prisma.$transaction.mockRejectedValue(dbError);

      await expect(service.create('user-1')).rejects.toBe(dbError);
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('rejects if the user is already an active member of another party', async () => {
      prisma.partyMember.findFirst.mockResolvedValue({
        id: 'member-9',
        partyId: 'other-party',
        userId: 'user-1',
        role: PartyMemberRole.customer,
      });

      await expect(service.create('user-1')).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('findByCode', () => {
    it('looks up a party matching either the short code or the qrToken', async () => {
      prisma.party.findFirst.mockResolvedValue(dbParty);

      await service.findByCode('ABC234');

      expect(prisma.party.findFirst).toHaveBeenCalledWith({
        where: { OR: [{ code: 'ABC234' }, { qrToken: 'ABC234' }] },
      });
    });

    it('returns the party when a match is found', async () => {
      prisma.party.findFirst.mockResolvedValue(dbParty);

      const result = await service.findByCode(dbParty.qrToken);

      expect(result.id).toBe(dbParty.id);
      expect(result.joinUrl).toBe(
        `https://example.test/join?code=${dbParty.qrToken}`,
      );
    });

    it('reflects an ended party rather than hiding it', async () => {
      prisma.party.findFirst.mockResolvedValue({
        ...dbParty,
        status: PartyStatus.ended,
      });

      const result = await service.findByCode(dbParty.code);

      expect(result.status).toBe(PartyStatus.ended);
    });

    it('throws NotFoundException for an unknown code', async () => {
      prisma.party.findFirst.mockResolvedValue(null);

      await expect(service.findByCode('NOPE12')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('joinAsGuest', () => {
    it('creates a PartyGuest and returns a signed party-scoped guest token', async () => {
      prisma.party.findFirst.mockResolvedValue(dbParty);
      prisma.partyGuest.create.mockResolvedValue({
        id: 'guest-1',
        partyId: dbParty.id,
        guestName: 'Alex',
        createdAt: new Date(),
      });

      const result = await service.joinAsGuest(dbParty.code, 'Alex');

      expect(prisma.partyGuest.create).toHaveBeenCalledWith({
        data: { partyId: dbParty.id, guestName: 'Alex' },
      });
      expect(jwtService.sign).toHaveBeenCalledWith(
        { role: AuthRole.guest, partyId: dbParty.id, guestId: 'guest-1' },
        expect.objectContaining({ expiresIn: expect.any(String) }),
      );
      expect(result).toEqual({
        accessToken: 'signed-guest-jwt',
        guest: { id: 'guest-1', partyId: dbParty.id, guestName: 'Alex' },
      });
    });

    it('throws NotFoundException for an unknown code', async () => {
      prisma.party.findFirst.mockResolvedValue(null);

      await expect(
        service.joinAsGuest('NOPE12', 'Alex'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ConflictException if the party has ended', async () => {
      prisma.party.findFirst.mockResolvedValue({
        ...dbParty,
        status: PartyStatus.ended,
      });

      await expect(
        service.joinAsGuest(dbParty.code, 'Alex'),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.partyGuest.create).not.toHaveBeenCalled();
    });
  });

  describe('joinAsUser', () => {
    const dbMember = {
      id: 'member-1',
      partyId: dbParty.id,
      userId: 'user-2',
      role: PartyMemberRole.customer,
      joinedAt: new Date('2026-01-01T00:00:00Z'),
      promotedAt: null,
    };

    it('upserts a customer PartyMember row for the current user', async () => {
      prisma.party.findFirst.mockResolvedValue(dbParty);
      prisma.partyMember.upsert.mockResolvedValue(dbMember);

      const result = await service.joinAsUser(dbParty.code, 'user-2');

      expect(prisma.partyMember.upsert).toHaveBeenCalledWith({
        where: { partyId_userId: { partyId: dbParty.id, userId: 'user-2' } },
        update: {},
        create: {
          partyId: dbParty.id,
          userId: 'user-2',
          role: PartyMemberRole.customer,
        },
      });
      expect(result).toEqual({
        id: dbMember.id,
        partyId: dbMember.partyId,
        userId: dbMember.userId,
        role: dbMember.role,
        joinedAt: dbMember.joinedAt.toISOString(),
        promotedAt: null,
      });
    });

    it('is idempotent — rejoining returns the existing membership rather than erroring', async () => {
      prisma.party.findFirst.mockResolvedValue(dbParty);
      prisma.partyMember.upsert.mockResolvedValue({
        ...dbMember,
        role: PartyMemberRole.bartender,
      });

      const result = await service.joinAsUser(dbParty.code, 'user-2');

      expect(result.role).toBe(PartyMemberRole.bartender);
    });

    it('throws ConflictException if the party has ended', async () => {
      prisma.party.findFirst.mockResolvedValue({
        ...dbParty,
        status: PartyStatus.ended,
      });

      await expect(
        service.joinAsUser(dbParty.code, 'user-2'),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.partyMember.upsert).not.toHaveBeenCalled();
    });

    it('rejects if the user is already an active member of a different party', async () => {
      prisma.party.findFirst.mockResolvedValue(dbParty);
      prisma.partyMember.findFirst.mockResolvedValue({
        id: 'member-9',
        partyId: 'other-party',
        userId: 'user-2',
        role: PartyMemberRole.customer,
      });

      await expect(
        service.joinAsUser(dbParty.code, 'user-2'),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.partyMember.upsert).not.toHaveBeenCalled();
    });

    it('excludes the target party from the other-active-party check, so rejoining works', async () => {
      prisma.party.findFirst.mockResolvedValue(dbParty);
      prisma.partyMember.findFirst.mockResolvedValue(null);
      prisma.partyMember.upsert.mockResolvedValue(dbMember);

      const result = await service.joinAsUser(dbParty.code, 'user-2');

      expect(prisma.partyMember.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-2',
          party: { status: PartyStatus.active },
          NOT: { partyId: dbParty.id },
        },
      });
      expect(result.id).toBe(dbMember.id);
    });
  });

  describe('end', () => {
    it('ends an active party and deletes its PartyMember and PartyGuest rows', async () => {
      prisma.party.findFirst.mockResolvedValue(dbParty);
      prisma.partyMember.findUnique.mockResolvedValue({
        role: PartyMemberRole.bartender,
      });
      tx.party.update.mockResolvedValue({
        ...dbParty,
        status: PartyStatus.ended,
        endedAt: new Date('2026-01-01T05:00:00Z'),
      });

      const result = await service.end(dbParty.code, 'user-1');

      expect(tx.party.update).toHaveBeenCalledWith({
        where: { id: dbParty.id },
        data: { status: PartyStatus.ended, endedAt: expect.any(Date) },
      });
      expect(tx.partyMember.deleteMany).toHaveBeenCalledWith({
        where: { partyId: dbParty.id },
      });
      expect(tx.partyGuest.deleteMany).toHaveBeenCalledWith({
        where: { partyId: dbParty.id },
      });
      expect(result.status).toBe(PartyStatus.ended);
      expect(result.endedAt).not.toBeNull();
    });

    it('throws ForbiddenException for a customer, not a bartender', async () => {
      prisma.party.findFirst.mockResolvedValue(dbParty);
      prisma.partyMember.findUnique.mockResolvedValue({
        role: PartyMemberRole.customer,
      });

      await expect(service.end(dbParty.code, 'user-2')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException for someone who never joined the party', async () => {
      prisma.party.findFirst.mockResolvedValue(dbParty);
      prisma.partyMember.findUnique.mockResolvedValue(null);

      await expect(
        service.end(dbParty.code, 'stranger'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws ConflictException if the party has already ended', async () => {
      prisma.party.findFirst.mockResolvedValue({
        ...dbParty,
        status: PartyStatus.ended,
      });
      prisma.partyMember.findUnique.mockResolvedValue({
        role: PartyMemberRole.bartender,
      });

      await expect(service.end(dbParty.code, 'user-1')).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for an unknown code', async () => {
      prisma.party.findFirst.mockResolvedValue(null);

      await expect(service.end('NOPE12', 'user-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('promote', () => {
    const dbMember = {
      id: 'member-2',
      partyId: dbParty.id,
      userId: 'user-2',
      role: PartyMemberRole.customer,
      joinedAt: new Date('2026-01-01T00:00:00Z'),
      promotedAt: null,
    };

    it('flips a customer PartyMember row to bartender', async () => {
      prisma.party.findFirst.mockResolvedValue(dbParty);
      prisma.partyMember.findUnique.mockResolvedValue(dbMember);
      prisma.partyMember.update.mockResolvedValue({
        ...dbMember,
        role: PartyMemberRole.bartender,
        promotedAt: new Date('2026-01-01T06:00:00Z'),
      });

      const result = await service.promote(dbParty.code, 'user-2');

      expect(prisma.partyMember.update).toHaveBeenCalledWith({
        where: { id: dbMember.id },
        data: { role: PartyMemberRole.bartender, promotedAt: expect.any(Date) },
      });
      expect(result.role).toBe(PartyMemberRole.bartender);
      expect(result.promotedAt).not.toBeNull();
    });

    it('is a no-op when the target is already a bartender', async () => {
      prisma.party.findFirst.mockResolvedValue(dbParty);
      prisma.partyMember.findUnique.mockResolvedValue({
        ...dbMember,
        role: PartyMemberRole.bartender,
      });

      const result = await service.promote(dbParty.code, 'user-2');

      expect(prisma.partyMember.update).not.toHaveBeenCalled();
      expect(result.role).toBe(PartyMemberRole.bartender);
    });

    it('throws NotFoundException for a user with no PartyMember row for this party', async () => {
      prisma.party.findFirst.mockResolvedValue(dbParty);
      prisma.partyMember.findUnique.mockResolvedValue(null);

      await expect(
        service.promote(dbParty.code, 'never-joined'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.partyMember.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for an unknown code', async () => {
      prisma.party.findFirst.mockResolvedValue(null);

      await expect(service.promote('NOPE12', 'user-2')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('getMyMembership', () => {
    it('returns the current user membership for the party', async () => {
      prisma.party.findFirst.mockResolvedValue(dbParty);
      prisma.partyMember.findUnique.mockResolvedValue({
        id: 'member-1',
        partyId: dbParty.id,
        userId: 'user-1',
        role: PartyMemberRole.bartender,
        joinedAt: new Date('2026-01-01T00:00:00Z'),
        promotedAt: null,
      });

      const result = await service.getMyMembership(dbParty.code, 'user-1');

      expect(result.role).toBe(PartyMemberRole.bartender);
    });

    it('throws NotFoundException when the user has not joined the party', async () => {
      prisma.party.findFirst.mockResolvedValue(dbParty);
      prisma.partyMember.findUnique.mockResolvedValue(null);

      await expect(
        service.getMyMembership(dbParty.code, 'stranger'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('getParticipants', () => {
    it('combines PartyMember and PartyGuest rows into one participant list', async () => {
      prisma.party.findFirst.mockResolvedValue(dbParty);
      prisma.partyMember.findMany.mockResolvedValue([
        {
          id: 'member-1',
          userId: 'user-1',
          user: { name: 'Alex' },
          role: PartyMemberRole.bartender,
          joinedAt: new Date('2026-01-01T00:00:00Z'),
          promotedAt: null,
        },
      ]);
      prisma.partyGuest.findMany.mockResolvedValue([
        {
          id: 'guest-1',
          guestName: 'Sam',
          createdAt: new Date('2026-01-01T00:05:00Z'),
        },
      ]);

      const result = await service.getParticipants(dbParty.code);

      expect(result).toEqual([
        {
          kind: 'member',
          id: 'member-1',
          userId: 'user-1',
          name: 'Alex',
          role: PartyMemberRole.bartender,
          joinedAt: '2026-01-01T00:00:00.000Z',
          promotedAt: null,
        },
        {
          kind: 'guest',
          id: 'guest-1',
          guestName: 'Sam',
          joinedAt: '2026-01-01T00:05:00.000Z',
        },
      ]);
    });

    it('throws NotFoundException for an unknown code', async () => {
      prisma.party.findFirst.mockResolvedValue(null);

      await expect(service.getParticipants('NOPE12')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('leave', () => {
    it('removes a customer membership', async () => {
      prisma.party.findFirst.mockResolvedValue(dbParty);
      prisma.partyMember.findUnique.mockResolvedValue({
        id: 'member-2',
        partyId: dbParty.id,
        userId: 'user-2',
        role: PartyMemberRole.customer,
      });

      await service.leave(dbParty.code, 'user-2');

      expect(prisma.partyMember.delete).toHaveBeenCalledWith({
        where: { id: 'member-2' },
      });
    });

    it('removes a bartender membership when other bartenders remain', async () => {
      prisma.party.findFirst.mockResolvedValue(dbParty);
      prisma.partyMember.findUnique.mockResolvedValue({
        id: 'member-2',
        partyId: dbParty.id,
        userId: 'user-2',
        role: PartyMemberRole.bartender,
      });
      prisma.partyMember.count.mockResolvedValue(2);

      await service.leave(dbParty.code, 'user-2');

      expect(prisma.partyMember.count).toHaveBeenCalledWith({
        where: { partyId: dbParty.id, role: PartyMemberRole.bartender },
      });
      expect(prisma.partyMember.delete).toHaveBeenCalledWith({
        where: { id: 'member-2' },
      });
    });

    it('rejects when the caller is the only bartender for the party', async () => {
      prisma.party.findFirst.mockResolvedValue(dbParty);
      prisma.partyMember.findUnique.mockResolvedValue({
        id: 'member-1',
        partyId: dbParty.id,
        userId: 'user-1',
        role: PartyMemberRole.bartender,
      });
      prisma.partyMember.count.mockResolvedValue(1);

      await expect(
        service.leave(dbParty.code, 'user-1'),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.partyMember.delete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for someone who never joined the party', async () => {
      prisma.party.findFirst.mockResolvedValue(dbParty);
      prisma.partyMember.findUnique.mockResolvedValue(null);

      await expect(
        service.leave(dbParty.code, 'stranger'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('demoteSelf', () => {
    it('flips a bartender back to customer when other bartenders remain', async () => {
      prisma.party.findFirst.mockResolvedValue(dbParty);
      prisma.partyMember.findUnique.mockResolvedValue({
        id: 'member-2',
        partyId: dbParty.id,
        userId: 'user-2',
        role: PartyMemberRole.bartender,
        promotedAt: new Date('2026-01-01T06:00:00Z'),
      });
      prisma.partyMember.count.mockResolvedValue(2);
      prisma.partyMember.update.mockResolvedValue({
        id: 'member-2',
        partyId: dbParty.id,
        userId: 'user-2',
        role: PartyMemberRole.customer,
        joinedAt: new Date('2026-01-01T00:00:00Z'),
        promotedAt: null,
      });

      const result = await service.demoteSelf(dbParty.code, 'user-2');

      expect(prisma.partyMember.update).toHaveBeenCalledWith({
        where: { id: 'member-2' },
        data: { role: PartyMemberRole.customer, promotedAt: null },
      });
      expect(result.role).toBe(PartyMemberRole.customer);
    });

    it('is a no-op when the caller is already a customer', async () => {
      prisma.party.findFirst.mockResolvedValue(dbParty);
      prisma.partyMember.findUnique.mockResolvedValue({
        id: 'member-2',
        partyId: dbParty.id,
        userId: 'user-2',
        role: PartyMemberRole.customer,
        joinedAt: new Date('2026-01-01T00:00:00Z'),
        promotedAt: null,
      });

      const result = await service.demoteSelf(dbParty.code, 'user-2');

      expect(prisma.partyMember.update).not.toHaveBeenCalled();
      expect(result.role).toBe(PartyMemberRole.customer);
    });

    it('rejects when the caller is the only bartender for the party', async () => {
      prisma.party.findFirst.mockResolvedValue(dbParty);
      prisma.partyMember.findUnique.mockResolvedValue({
        id: 'member-1',
        partyId: dbParty.id,
        userId: 'user-1',
        role: PartyMemberRole.bartender,
      });
      prisma.partyMember.count.mockResolvedValue(1);

      await expect(
        service.demoteSelf(dbParty.code, 'user-1'),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.partyMember.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for someone who never joined the party', async () => {
      prisma.party.findFirst.mockResolvedValue(dbParty);
      prisma.partyMember.findUnique.mockResolvedValue(null);

      await expect(
        service.demoteSelf(dbParty.code, 'stranger'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('getMyActiveParty', () => {
    it('returns the active party and membership for the current user', async () => {
      prisma.partyMember.findFirst.mockResolvedValue({
        id: 'member-1',
        partyId: dbParty.id,
        userId: 'user-1',
        role: PartyMemberRole.bartender,
        joinedAt: new Date('2026-01-01T00:00:00Z'),
        promotedAt: null,
        party: dbParty,
      });

      const result = await service.getMyActiveParty('user-1');

      expect(prisma.partyMember.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-1', party: { status: PartyStatus.active } },
        include: { party: true },
      });
      expect(result.party.id).toBe(dbParty.id);
      expect(result.member.role).toBe(PartyMemberRole.bartender);
    });

    it('throws NotFoundException when the user has no active party', async () => {
      prisma.partyMember.findFirst.mockResolvedValue(null);

      await expect(service.getMyActiveParty('user-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
