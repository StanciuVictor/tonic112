import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DrinkCategory } from '@tonic112/shared-types';
import { PrismaService } from '../prisma/prisma.service';
import { AddRecipeIngredientDto } from './dto/recipe/add-recipe-ingredient.dto';
import { CreateDrinkDto } from './dto/drink/create-drink.dto';
import { CreateIngredientDto } from './dto/ingredient/create-ingredient.dto';
import { UpdateDrinkDto } from './dto/drink/update-drink.dto';
import { UpdateIngredientDto } from './dto/ingredient/update-ingredient.dto';
import { UpdateRecipeIngredientDto } from './dto/recipe/update-recipe-ingredient.dto';
import { CatalogService } from './catalog.service';

describe('CatalogService', () => {
  let service: CatalogService;
  let prisma: {
    drink: {
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
    };
    ingredient: {
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
    };
    drinkIngredient: {
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      findUnique: jest.Mock;
    };
  };

  const dbDrink = {
    id: 'drink-1',
    name: 'Martini',
    description: 'Classic gin cocktail',
    category: DrinkCategory.cocktail,
    imageUrl: null,
    active: true,
    price: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  const dbIngredient = {
    id: 'ingredient-1',
    name: { en: 'Gin', ro: 'Gin' },
    unit: 'ml',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(async () => {
    prisma = {
      drink: {
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      ingredient: {
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      drinkIngredient: {
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [CatalogService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(CatalogService);
  });

  describe('createDrink', () => {
    it('creates a drink and returns it', async () => {
      const dto: CreateDrinkDto = {
        name: 'Martini',
        description: 'Classic gin cocktail',
        category: DrinkCategory.cocktail,
      };
      prisma.drink.create.mockResolvedValue(dbDrink);

      const result = await service.createDrink(dto);

      expect(prisma.drink.create).toHaveBeenCalledWith({
        data: {
          name: 'Martini',
          description: 'Classic gin cocktail',
          category: DrinkCategory.cocktail,
          imageUrl: undefined,
          active: undefined,
        },
      });
      expect(result).toEqual({
        id: 'drink-1',
        name: 'Martini',
        description: 'Classic gin cocktail',
        category: DrinkCategory.cocktail,
        imageUrl: null,
        active: true,
        createdAt: dbDrink.createdAt.toISOString(),
        updatedAt: dbDrink.updatedAt.toISOString(),
      });
    });
  });

  describe('updateDrink', () => {
    it('throws NotFoundException for an unknown drink', async () => {
      prisma.drink.findUnique.mockResolvedValue(null);

      await expect(
        service.updateDrink('missing', { active: false }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.drink.update).not.toHaveBeenCalled();
    });

    it('updates an existing drink', async () => {
      prisma.drink.findUnique.mockResolvedValue(dbDrink);
      prisma.drink.update.mockResolvedValue({ ...dbDrink, active: false });
      const dto: UpdateDrinkDto = { active: false };

      const result = await service.updateDrink('drink-1', dto);

      expect(prisma.drink.update).toHaveBeenCalledWith({
        where: { id: 'drink-1' },
        data: {
          name: undefined,
          description: undefined,
          category: undefined,
          imageUrl: undefined,
          active: false,
        },
      });
      expect(result.active).toBe(false);
    });
  });

  describe('deleteDrink', () => {
    it('throws NotFoundException for an unknown drink', async () => {
      prisma.drink.findUnique.mockResolvedValue(null);

      await expect(service.deleteDrink('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.drink.delete).not.toHaveBeenCalled();
    });

    it('deletes an existing drink', async () => {
      prisma.drink.findUnique.mockResolvedValue(dbDrink);

      await service.deleteDrink('drink-1');

      expect(prisma.drink.delete).toHaveBeenCalledWith({
        where: { id: 'drink-1' },
      });
    });
  });

  describe('createIngredient', () => {
    it('creates an ingredient with both languages', async () => {
      const dto: CreateIngredientDto = {
        name: { en: 'Gin', ro: 'Gin' },
        unit: 'ml',
      };
      prisma.ingredient.create.mockResolvedValue(dbIngredient);

      const result = await service.createIngredient(dto);

      expect(prisma.ingredient.create).toHaveBeenCalledWith({
        data: { name: { en: 'Gin', ro: 'Gin' }, unit: 'ml' },
      });
      expect(result.name).toEqual({ en: 'Gin', ro: 'Gin' });
    });
  });

  describe('updateIngredient', () => {
    it('throws NotFoundException for an unknown ingredient', async () => {
      prisma.ingredient.findUnique.mockResolvedValue(null);

      await expect(
        service.updateIngredient('missing', { unit: 'oz' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('updates only the provided fields', async () => {
      prisma.ingredient.findUnique.mockResolvedValue(dbIngredient);
      prisma.ingredient.update.mockResolvedValue({
        ...dbIngredient,
        unit: 'oz',
      });
      const dto: UpdateIngredientDto = { unit: 'oz' };

      await service.updateIngredient('ingredient-1', dto);

      expect(prisma.ingredient.update).toHaveBeenCalledWith({
        where: { id: 'ingredient-1' },
        data: { name: undefined, unit: 'oz' },
      });
    });
  });

  describe('deleteIngredient', () => {
    it('throws NotFoundException for an unknown ingredient', async () => {
      prisma.ingredient.findUnique.mockResolvedValue(null);

      await expect(service.deleteIngredient('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('deletes an existing ingredient', async () => {
      prisma.ingredient.findUnique.mockResolvedValue(dbIngredient);

      await service.deleteIngredient('ingredient-1');

      expect(prisma.ingredient.delete).toHaveBeenCalledWith({
        where: { id: 'ingredient-1' },
      });
    });
  });

  describe('listIngredients', () => {
    it('returns every ingredient', async () => {
      prisma.ingredient.findMany.mockResolvedValue([dbIngredient]);

      const result = await service.listIngredients();

      expect(result).toEqual([
        {
          id: 'ingredient-1',
          name: { en: 'Gin', ro: 'Gin' },
          unit: 'ml',
          createdAt: dbIngredient.createdAt.toISOString(),
          updatedAt: dbIngredient.updatedAt.toISOString(),
        },
      ]);
    });
  });

  describe('addRecipeIngredient', () => {
    const dto: AddRecipeIngredientDto = {
      ingredientId: 'ingredient-1',
      quantity: 50,
      instructions: { en: 'Shake with ice', ro: 'Se agită cu gheață' },
    };

    it('throws NotFoundException when the drink does not exist', async () => {
      prisma.drink.findUnique.mockResolvedValue(null);

      await expect(
        service.addRecipeIngredient('missing', dto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NotFoundException when the ingredient does not exist', async () => {
      prisma.drink.findUnique.mockResolvedValue(dbDrink);
      prisma.ingredient.findUnique.mockResolvedValue(null);

      await expect(
        service.addRecipeIngredient('drink-1', dto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ConflictException when the ingredient is already in the recipe', async () => {
      prisma.drink.findUnique.mockResolvedValue(dbDrink);
      prisma.ingredient.findUnique.mockResolvedValue(dbIngredient);
      prisma.drinkIngredient.findUnique.mockResolvedValue({ id: 'line-1' });

      await expect(
        service.addRecipeIngredient('drink-1', dto),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.drinkIngredient.create).not.toHaveBeenCalled();
    });

    it('adds a recipe line with the joined ingredient data', async () => {
      prisma.drink.findUnique.mockResolvedValue(dbDrink);
      prisma.ingredient.findUnique.mockResolvedValue(dbIngredient);
      prisma.drinkIngredient.findUnique.mockResolvedValue(null);
      prisma.drinkIngredient.create.mockResolvedValue({
        id: 'line-1',
        drinkId: 'drink-1',
        ingredientId: 'ingredient-1',
        quantity: 50,
        instructions: { en: 'Shake with ice', ro: 'Se agită cu gheață' },
        ingredient: dbIngredient,
      });

      const result = await service.addRecipeIngredient('drink-1', dto);

      expect(prisma.drinkIngredient.create).toHaveBeenCalledWith({
        data: {
          drinkId: 'drink-1',
          ingredientId: 'ingredient-1',
          quantity: 50,
          instructions: { en: 'Shake with ice', ro: 'Se agită cu gheață' },
        },
        include: { ingredient: true },
      });
      expect(result).toEqual({
        ingredientId: 'ingredient-1',
        ingredientName: { en: 'Gin', ro: 'Gin' },
        unit: 'ml',
        quantity: 50,
        instructions: { en: 'Shake with ice', ro: 'Se agită cu gheață' },
      });
    });
  });

  describe('updateRecipeIngredient', () => {
    const dto: UpdateRecipeIngredientDto = { quantity: 60 };

    it('throws NotFoundException when the recipe line does not exist', async () => {
      prisma.drinkIngredient.findUnique.mockResolvedValue(null);

      await expect(
        service.updateRecipeIngredient('drink-1', 'ingredient-1', dto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('updates the recipe line', async () => {
      prisma.drinkIngredient.findUnique.mockResolvedValue({ id: 'line-1' });
      prisma.drinkIngredient.update.mockResolvedValue({
        id: 'line-1',
        drinkId: 'drink-1',
        ingredientId: 'ingredient-1',
        quantity: 60,
        instructions: { en: 'Shake with ice', ro: 'Se agită cu gheață' },
        ingredient: dbIngredient,
      });

      const result = await service.updateRecipeIngredient(
        'drink-1',
        'ingredient-1',
        dto,
      );

      expect(prisma.drinkIngredient.update).toHaveBeenCalledWith({
        where: { id: 'line-1' },
        data: { quantity: 60, instructions: undefined },
        include: { ingredient: true },
      });
      expect(result.quantity).toBe(60);
    });
  });

  describe('removeRecipeIngredient', () => {
    it('throws NotFoundException when the recipe line does not exist', async () => {
      prisma.drinkIngredient.findUnique.mockResolvedValue(null);

      await expect(
        service.removeRecipeIngredient('drink-1', 'ingredient-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('removes the recipe line', async () => {
      prisma.drinkIngredient.findUnique.mockResolvedValue({ id: 'line-1' });

      await service.removeRecipeIngredient('drink-1', 'ingredient-1');

      expect(prisma.drinkIngredient.delete).toHaveBeenCalledWith({
        where: { id: 'line-1' },
      });
    });
  });

  describe('listDrinks', () => {
    it('filters to active drinks only for non-admins', async () => {
      prisma.drink.findMany.mockResolvedValue([dbDrink]);

      await service.listDrinks(false);

      expect(prisma.drink.findMany).toHaveBeenCalledWith({
        where: { active: true },
        orderBy: { createdAt: 'asc' },
      });
    });

    it('returns every drink, including inactive ones, for admins', async () => {
      prisma.drink.findMany.mockResolvedValue([dbDrink]);

      await service.listDrinks(true);

      expect(prisma.drink.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('getDrinkDetail', () => {
    const dbDrinkWithRecipe = {
      ...dbDrink,
      recipe: [
        {
          id: 'line-1',
          drinkId: 'drink-1',
          ingredientId: 'ingredient-1',
          quantity: 50,
          instructions: { en: 'Shake with ice', ro: 'Se agită cu gheață' },
          ingredient: dbIngredient,
        },
      ],
    };

    it('throws NotFoundException for an unknown drink', async () => {
      prisma.drink.findUnique.mockResolvedValue(null);

      await expect(
        service.getDrinkDetail('missing', false),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NotFoundException for an inactive drink requested by a non-admin', async () => {
      prisma.drink.findUnique.mockResolvedValue({
        ...dbDrinkWithRecipe,
        active: false,
      });

      await expect(
        service.getDrinkDetail('drink-1', false),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns an inactive drink for an admin', async () => {
      prisma.drink.findUnique.mockResolvedValue({
        ...dbDrinkWithRecipe,
        active: false,
      });

      const result = await service.getDrinkDetail('drink-1', true);

      expect(result.active).toBe(false);
    });

    it('returns the drink with its recipe, ingredient names, and instructions', async () => {
      prisma.drink.findUnique.mockResolvedValue(dbDrinkWithRecipe);

      const result = await service.getDrinkDetail('drink-1', false);

      expect(prisma.drink.findUnique).toHaveBeenCalledWith({
        where: { id: 'drink-1' },
        include: { recipe: { include: { ingredient: true } } },
      });
      expect(result.recipe).toEqual([
        {
          ingredientId: 'ingredient-1',
          ingredientName: { en: 'Gin', ro: 'Gin' },
          unit: 'ml',
          quantity: 50,
          instructions: { en: 'Shake with ice', ro: 'Se agită cu gheață' },
        },
      ]);
    });
  });
});
