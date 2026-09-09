import { Test } from '@nestjs/testing';
import {
  DrinkCategory,
  DrinkDetailDto,
  DrinkDto,
} from '@tonic112/shared-types';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';

describe('CatalogController', () => {
  let controller: CatalogController;
  let catalogService: {
    listDrinks: jest.Mock;
    getDrinkDetail: jest.Mock;
  };

  const drink: DrinkDto = {
    id: 'drink-1',
    name: 'Martini',
    description: 'Classic gin cocktail',
    category: DrinkCategory.cocktail,
    imageUrl: null,
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    catalogService = {
      listDrinks: jest.fn(),
      getDrinkDetail: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [CatalogController],
      providers: [{ provide: CatalogService, useValue: catalogService }],
    }).compile();

    controller = module.get(CatalogController);
  });

  describe('listDrinks', () => {
    it('passes isAdmin=true for an admin caller', async () => {
      const user: JwtPayload = {
        sub: 'user-1',
        isAdmin: true,
        canCreateParty: false,
      };
      catalogService.listDrinks.mockResolvedValue([drink]);

      await expect(controller.listDrinks(user)).resolves.toEqual([drink]);
      expect(catalogService.listDrinks).toHaveBeenCalledWith(true);
    });

    it('passes isAdmin=false for a non-admin caller', async () => {
      const user: JwtPayload = {
        sub: 'user-2',
        isAdmin: false,
        canCreateParty: false,
      };
      catalogService.listDrinks.mockResolvedValue([drink]);

      await controller.listDrinks(user);

      expect(catalogService.listDrinks).toHaveBeenCalledWith(false);
    });

    it('passes isAdmin=false for a guest caller with no isAdmin field at all', async () => {
      const guest = {
        role: 'guest',
        partyId: 'party-1',
        guestId: 'guest-1',
      } as unknown as JwtPayload;
      catalogService.listDrinks.mockResolvedValue([drink]);

      await controller.listDrinks(guest);

      expect(catalogService.listDrinks).toHaveBeenCalledWith(undefined);
    });
  });

  describe('getDrinkDetail', () => {
    it('fetches a drink by id for the current caller', async () => {
      const user: JwtPayload = {
        sub: 'user-1',
        isAdmin: true,
        canCreateParty: false,
      };
      const detail: DrinkDetailDto = { ...drink, recipe: [] };
      catalogService.getDrinkDetail.mockResolvedValue(detail);

      await expect(controller.getDrinkDetail('drink-1', user)).resolves.toBe(
        detail,
      );
      expect(catalogService.getDrinkDetail).toHaveBeenCalledWith(
        'drink-1',
        true,
      );
    });
  });
});
