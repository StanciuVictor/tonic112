import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '../../../generated/prisma/client';
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
    party: { findFirst: jest.Mock };
  };
  let tx: {
    party: { create: jest.Mock };
    partyMember: { create: jest.Mock };
  };

  const dbParty = {
    id: 'party-1',
    code: 'ABC234',
    qrToken: 'qr-token-value',
    status: 'active' as const,
    createdByUserId: 'user-1',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    startedAt: new Date('2026-01-01T00:00:00Z'),
    endedAt: null,
  };

  beforeEach(async () => {
    process.env.WEB_BASE_URL = 'https://example.test';

    tx = {
      party: { create: jest.fn().mockResolvedValue(dbParty) },
      partyMember: { create: jest.fn().mockResolvedValue({}) },
    };
    prisma = {
      $transaction: jest.fn((cb) => cb(tx)),
      party: { findFirst: jest.fn() },
    };

    const module = await Test.createTestingModule({
      providers: [PartyService, { provide: PrismaService, useValue: prisma }],
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
        data: { partyId: dbParty.id, userId: 'user-1', role: 'bartender' },
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
        status: 'ended',
      });

      const result = await service.findByCode(dbParty.code);

      expect(result.status).toBe('ended');
    });

    it('throws NotFoundException for an unknown code', async () => {
      prisma.party.findFirst.mockResolvedValue(null);

      await expect(service.findByCode('NOPE12')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
