import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Test } from '@nestjs/testing';
import {
  DrinkCategory,
  DrinkDto,
  IngredientDto,
  RecipeLineDto,
} from '@tonic112/shared-types';
import { AdminGuard } from '../auth/guards/admin.guard';
import { PrismaService } from '../prisma/prisma.service';
import { AdminCatalogController } from './admin-catalog.controller';
import { CatalogService } from './catalog.service';

describe('AdminCatalogController', () => {
  let controller: AdminCatalogController;
  let catalogService: {
    createDrink: jest.Mock;
    updateDrink: jest.Mock;
    deleteDrink: jest.Mock;
    listIngredients: jest.Mock;
    createIngredient: jest.Mock;
    updateIngredient: jest.Mock;
    deleteIngredient: jest.Mock;
    addRecipeIngredient: jest.Mock;
    updateRecipeIngredient: jest.Mock;
    removeRecipeIngredient: jest.Mock;
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

  const ingredient: IngredientDto = {
    id: 'ingredient-1',
    name: { en: 'Gin', ro: 'Gin' },
    unit: 'ml',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  const recipeLine: RecipeLineDto = {
    ingredientId: 'ingredient-1',
    ingredientName: { en: 'Gin', ro: 'Gin' },
    unit: 'ml',
    quantity: 50,
    instructions: { en: 'Shake with ice', ro: 'Se agită cu gheață' },
  };

  beforeEach(async () => {
    catalogService = {
      createDrink: jest.fn(),
      updateDrink: jest.fn(),
      deleteDrink: jest.fn(),
      listIngredients: jest.fn(),
      createIngredient: jest.fn(),
      updateIngredient: jest.fn(),
      deleteIngredient: jest.fn(),
      addRecipeIngredient: jest.fn(),
      updateRecipeIngredient: jest.fn(),
      removeRecipeIngredient: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [AdminCatalogController],
      providers: [
        { provide: CatalogService, useValue: catalogService },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get(AdminCatalogController);
  });

  it('gates every route in this controller behind AdminGuard', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, AdminCatalogController);

    expect(guards).toContain(AdminGuard);
  });

  it('creates a drink', async () => {
    const dto = {
      name: 'Martini',
      description: 'Classic gin cocktail',
      category: DrinkCategory.cocktail,
    };
    catalogService.createDrink.mockResolvedValue(drink);

    await expect(controller.createDrink(dto)).resolves.toBe(drink);
    expect(catalogService.createDrink).toHaveBeenCalledWith(dto);
  });

  it('updates a drink', async () => {
    const dto = { active: false };
    catalogService.updateDrink.mockResolvedValue({ ...drink, active: false });

    await controller.updateDrink('drink-1', dto);

    expect(catalogService.updateDrink).toHaveBeenCalledWith('drink-1', dto);
  });

  it('deletes a drink', async () => {
    catalogService.deleteDrink.mockResolvedValue(undefined);

    await controller.deleteDrink('drink-1');

    expect(catalogService.deleteDrink).toHaveBeenCalledWith('drink-1');
  });

  it('lists ingredients', async () => {
    catalogService.listIngredients.mockResolvedValue([ingredient]);

    await expect(controller.listIngredients()).resolves.toEqual([ingredient]);
  });

  it('creates an ingredient', async () => {
    const dto = { name: { en: 'Gin', ro: 'Gin' }, unit: 'ml' };
    catalogService.createIngredient.mockResolvedValue(ingredient);

    await expect(controller.createIngredient(dto)).resolves.toBe(ingredient);
    expect(catalogService.createIngredient).toHaveBeenCalledWith(dto);
  });

  it('updates an ingredient', async () => {
    const dto = { unit: 'oz' };
    catalogService.updateIngredient.mockResolvedValue({
      ...ingredient,
      unit: 'oz',
    });

    await controller.updateIngredient('ingredient-1', dto);

    expect(catalogService.updateIngredient).toHaveBeenCalledWith(
      'ingredient-1',
      dto,
    );
  });

  it('deletes an ingredient', async () => {
    catalogService.deleteIngredient.mockResolvedValue(undefined);

    await controller.deleteIngredient('ingredient-1');

    expect(catalogService.deleteIngredient).toHaveBeenCalledWith(
      'ingredient-1',
    );
  });

  it('adds a recipe ingredient to a drink', async () => {
    const dto = {
      ingredientId: 'ingredient-1',
      quantity: 50,
      instructions: { en: 'Shake with ice', ro: 'Se agită cu gheață' },
    };
    catalogService.addRecipeIngredient.mockResolvedValue(recipeLine);

    await expect(controller.addRecipeIngredient('drink-1', dto)).resolves.toBe(
      recipeLine,
    );
    expect(catalogService.addRecipeIngredient).toHaveBeenCalledWith(
      'drink-1',
      dto,
    );
  });

  it('updates a recipe ingredient', async () => {
    const dto = { quantity: 60 };
    catalogService.updateRecipeIngredient.mockResolvedValue({
      ...recipeLine,
      quantity: 60,
    });

    await controller.updateRecipeIngredient('drink-1', 'ingredient-1', dto);

    expect(catalogService.updateRecipeIngredient).toHaveBeenCalledWith(
      'drink-1',
      'ingredient-1',
      dto,
    );
  });

  it('removes a recipe ingredient', async () => {
    catalogService.removeRecipeIngredient.mockResolvedValue(undefined);

    await controller.removeRecipeIngredient('drink-1', 'ingredient-1');

    expect(catalogService.removeRecipeIngredient).toHaveBeenCalledWith(
      'drink-1',
      'ingredient-1',
    );
  });
});
