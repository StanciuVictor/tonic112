import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { PartyDto } from '@tonic112/shared-types';
import { IS_PUBLIC_KEY } from '../auth/decorators/public.decorator';
import { REQUIRE_FLAGS_KEY } from '../auth/decorators/require-flags.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { PartyController } from './party.controller';
import { PartyService } from './party.service';

describe('PartyController', () => {
  let controller: PartyController;
  let partyService: { create: jest.Mock; findByCode: jest.Mock };
  let reflector: Reflector;

  beforeEach(async () => {
    partyService = { create: jest.fn(), findByCode: jest.fn() };

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
      status: 'active',
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
      status: 'active',
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
});
