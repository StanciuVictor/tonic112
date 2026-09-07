import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import {
  PartyDto,
  PartyMemberDto,
  PartyMemberRole,
  PartyStatus,
} from '@tonic112/shared-types';
import { IS_PUBLIC_KEY } from '../auth/decorators/public.decorator';
import { REQUIRE_FLAGS_KEY } from '../auth/decorators/require-flags.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { JoinGuestDto } from './dto/join-guest.dto';
import { PartyController } from './party.controller';
import { PartyService } from './party.service';

describe('PartyController', () => {
  let controller: PartyController;
  let partyService: {
    create: jest.Mock;
    findByCode: jest.Mock;
    joinAsGuest: jest.Mock;
    joinAsUser: jest.Mock;
    end: jest.Mock;
  };
  let reflector: Reflector;

  beforeEach(async () => {
    partyService = {
      create: jest.fn(),
      findByCode: jest.fn(),
      joinAsGuest: jest.fn(),
      joinAsUser: jest.fn(),
      end: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [PartyController],
      providers: [{ provide: PartyService, useValue: partyService }],
    }).compile();

    controller = module.get(PartyController);
    reflector = new Reflector();
  });

  it('gates party creation behind canCreateParty', () => {
    const requiredFlags = reflector.get(REQUIRE_FLAGS_KEY, controller.create);
    expect(requiredFlags).toEqual(['canCreateParty']);
  });

  it('creates a party for the current user and returns it', async () => {
    const payload: JwtPayload = {
      sub: 'user-1',
      isAdmin: false,
      canCreateParty: true,
    };
    const party: PartyDto = {
      id: 'party-1',
      code: 'ABC234',
      status: PartyStatus.active,
      createdByUserId: 'user-1',
      createdAt: '2026-01-01T00:00:00.000Z',
      startedAt: '2026-01-01T00:00:00.000Z',
      endedAt: null,
      joinUrl: 'https://example.test/join?code=qr-token',
    };
    partyService.create.mockResolvedValue(party);

    await expect(controller.create(payload)).resolves.toBe(party);
    expect(partyService.create).toHaveBeenCalledWith('user-1');
  });

  it('marks the code/QR lookup route as public', () => {
    const isPublic = reflector.get(IS_PUBLIC_KEY, controller.findByCode);
    expect(isPublic).toBe(true);
  });

  it('looks up a party by its code', async () => {
    const party: PartyDto = {
      id: 'party-1',
      code: 'ABC234',
      status: PartyStatus.active,
      createdByUserId: 'user-1',
      createdAt: '2026-01-01T00:00:00.000Z',
      startedAt: '2026-01-01T00:00:00.000Z',
      endedAt: null,
      joinUrl: 'https://example.test/join?code=qr-token',
    };
    partyService.findByCode.mockResolvedValue(party);

    await expect(controller.findByCode('ABC234')).resolves.toBe(party);
    expect(partyService.findByCode).toHaveBeenCalledWith('ABC234');
  });

  it('marks the guest-join route as public', () => {
    const isPublic = reflector.get(IS_PUBLIC_KEY, controller.joinAsGuest);
    expect(isPublic).toBe(true);
  });

  it('joins as a guest and returns the service result', async () => {
    const dto: JoinGuestDto = { guestName: 'Alex' };
    const response = {
      accessToken: 'signed-guest-jwt',
      guest: { id: 'guest-1', partyId: 'party-1', guestName: 'Alex' },
    };
    partyService.joinAsGuest.mockResolvedValue(response);

    await expect(controller.joinAsGuest('ABC234', dto)).resolves.toBe(response);
    expect(partyService.joinAsGuest).toHaveBeenCalledWith('ABC234', 'Alex');
  });

  it('joins as the current user and returns their membership', async () => {
    const payload: JwtPayload = {
      sub: 'user-2',
      isAdmin: false,
      canCreateParty: false,
    };
    const member: PartyMemberDto = {
      id: 'member-1',
      partyId: 'party-1',
      userId: 'user-2',
      role: PartyMemberRole.customer,
      joinedAt: '2026-01-01T00:00:00.000Z',
      promotedAt: null,
    };
    partyService.joinAsUser.mockResolvedValue(member);

    await expect(controller.joinAsUser('ABC234', payload)).resolves.toBe(
      member,
    );
    expect(partyService.joinAsUser).toHaveBeenCalledWith('ABC234', 'user-2');
  });

  it('ends a party as the current user', async () => {
    const payload: JwtPayload = {
      sub: 'user-1',
      isAdmin: false,
      canCreateParty: true,
    };
    const party: PartyDto = {
      id: 'party-1',
      code: 'ABC234',
      status: PartyStatus.ended,
      createdByUserId: 'user-1',
      createdAt: '2026-01-01T00:00:00.000Z',
      startedAt: '2026-01-01T00:00:00.000Z',
      endedAt: '2026-01-01T05:00:00.000Z',
      joinUrl: 'https://example.test/join?code=qr-token',
    };
    partyService.end.mockResolvedValue(party);

    await expect(controller.end('ABC234', payload)).resolves.toBe(party);
    expect(partyService.end).toHaveBeenCalledWith('ABC234', 'user-1');
  });
});
