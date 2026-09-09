import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DrinkDetailDto,
  DrinkDto,
  IngredientDto,
  RecipeLineDto,
  TranslatedText,
} from '@tonic112/shared-types';
import {
  Drink,
  DrinkIngredient,
  Ingredient,
} from '../../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AddRecipeIngredientDto } from './dto/recipe/add-recipe-ingredient.dto';
import { CreateDrinkDto } from './dto/drink/create-drink.dto';
import { CreateIngredientDto } from './dto/ingredient/create-ingredient.dto';
import { UpdateDrinkDto } from './dto/drink/update-drink.dto';
import { UpdateIngredientDto } from './dto/ingredient/update-ingredient.dto';
import { UpdateRecipeIngredientDto } from './dto/recipe/update-recipe-ingredient.dto';

type RecipeLineWithIngredient = DrinkIngredient & { ingredient: Ingredient };

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async createDrink(dto: CreateDrinkDto): Promise<DrinkDto> {
    const drink = await this.prisma.drink.create({
      data: {
        name: dto.name,
        description: dto.description,
        category: dto.category,
        imageUrl: dto.imageUrl,
        active: dto.active,
      },
    });
    return this.toDrinkDto(drink);
  }

  async updateDrink(id: string, dto: UpdateDrinkDto): Promise<DrinkDto> {
    await this.findDrinkOrThrow(id);
    const drink = await this.prisma.drink.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        category: dto.category,
        imageUrl: dto.imageUrl,
        active: dto.active,
      },
    });
    return this.toDrinkDto(drink);
  }

  async deleteDrink(id: string): Promise<void> {
    await this.findDrinkOrThrow(id);
    await this.prisma.drink.delete({ where: { id } });
  }

  async createIngredient(dto: CreateIngredientDto): Promise<IngredientDto> {
    const ingredient = await this.prisma.ingredient.create({
      data: { name: { en: dto.name.en, ro: dto.name.ro }, unit: dto.unit },
    });
    return this.toIngredientDto(ingredient);
  }

  async updateIngredient(
    id: string,
    dto: UpdateIngredientDto,
  ): Promise<IngredientDto> {
    await this.findIngredientOrThrow(id);
    const ingredient = await this.prisma.ingredient.update({
      where: { id },
      data: {
        name: dto.name ? { en: dto.name.en, ro: dto.name.ro } : undefined,
        unit: dto.unit,
      },
    });
    return this.toIngredientDto(ingredient);
  }

  async deleteIngredient(id: string): Promise<void> {
    await this.findIngredientOrThrow(id);
    await this.prisma.ingredient.delete({ where: { id } });
  }

  async listIngredients(): Promise<IngredientDto[]> {
    const ingredients = await this.prisma.ingredient.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return ingredients.map((i) => this.toIngredientDto(i));
  }

  async addRecipeIngredient(
    drinkId: string,
    dto: AddRecipeIngredientDto,
  ): Promise<RecipeLineDto> {
    await this.findDrinkOrThrow(drinkId);
    await this.findIngredientOrThrow(dto.ingredientId);

    const existing = await this.prisma.drinkIngredient.findUnique({
      where: {
        drinkId_ingredientId: { drinkId, ingredientId: dto.ingredientId },
      },
    });
    if (existing) {
      throw new ConflictException(
        'This ingredient is already in the recipe — update it instead',
      );
    }

    const line = await this.prisma.drinkIngredient.create({
      data: {
        drinkId,
        ingredientId: dto.ingredientId,
        quantity: dto.quantity,
        instructions: { en: dto.instructions.en, ro: dto.instructions.ro },
      },
      include: { ingredient: true },
    });
    return this.toRecipeLineDto(line);
  }

  async updateRecipeIngredient(
    drinkId: string,
    ingredientId: string,
    dto: UpdateRecipeIngredientDto,
  ): Promise<RecipeLineDto> {
    const existing = await this.findRecipeLineOrThrow(drinkId, ingredientId);
    const line = await this.prisma.drinkIngredient.update({
      where: { id: existing.id },
      data: {
        quantity: dto.quantity,
        instructions: dto.instructions
          ? { en: dto.instructions.en, ro: dto.instructions.ro }
          : undefined,
      },
      include: { ingredient: true },
    });
    return this.toRecipeLineDto(line);
  }

  async removeRecipeIngredient(
    drinkId: string,
    ingredientId: string,
  ): Promise<void> {
    const existing = await this.findRecipeLineOrThrow(drinkId, ingredientId);
    await this.prisma.drinkIngredient.delete({ where: { id: existing.id } });
  }

  // isAdmin sees every drink (including inactive ones, for the management
  // screen); everyone else only sees the active menu — see Epic 06's
  // Frontend Tasks ("isAdmin catalog management screens" need to list and
  // re-enable a hidden drink, which a filtered list could never show again).
  async listDrinks(isAdmin: boolean): Promise<DrinkDto[]> {
    const drinks = await this.prisma.drink.findMany({
      where: isAdmin ? undefined : { active: true },
      orderBy: { createdAt: 'asc' },
    });
    return drinks.map((d) => this.toDrinkDto(d));
  }

  async getDrinkDetail(id: string, isAdmin: boolean): Promise<DrinkDetailDto> {
    const drink = await this.prisma.drink.findUnique({
      where: { id },
      include: { recipe: { include: { ingredient: true } } },
    });
    if (!drink || (!drink.active && !isAdmin)) {
      throw new NotFoundException('Drink not found');
    }
    return {
      ...this.toDrinkDto(drink),
      recipe: drink.recipe.map((line) => this.toRecipeLineDto(line)),
    };
  }

  private async findDrinkOrThrow(id: string): Promise<Drink> {
    const drink = await this.prisma.drink.findUnique({ where: { id } });
    if (!drink) {
      throw new NotFoundException('Drink not found');
    }
    return drink;
  }

  private async findIngredientOrThrow(id: string): Promise<Ingredient> {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id },
    });
    if (!ingredient) {
      throw new NotFoundException('Ingredient not found');
    }
    return ingredient;
  }

  private async findRecipeLineOrThrow(
    drinkId: string,
    ingredientId: string,
  ): Promise<DrinkIngredient> {
    const line = await this.prisma.drinkIngredient.findUnique({
      where: { drinkId_ingredientId: { drinkId, ingredientId } },
    });
    if (!line) {
      throw new NotFoundException('This ingredient is not in the recipe');
    }
    return line;
  }

  private toDrinkDto(drink: Drink): DrinkDto {
    return {
      id: drink.id,
      name: drink.name,
      description: drink.description,
      category: drink.category,
      imageUrl: drink.imageUrl,
      active: drink.active,
      createdAt: drink.createdAt.toISOString(),
      updatedAt: drink.updatedAt.toISOString(),
    };
  }

  private toIngredientDto(ingredient: Ingredient): IngredientDto {
    return {
      id: ingredient.id,
      name: ingredient.name as unknown as TranslatedText,
      unit: ingredient.unit,
      createdAt: ingredient.createdAt.toISOString(),
      updatedAt: ingredient.updatedAt.toISOString(),
    };
  }

  private toRecipeLineDto(line: RecipeLineWithIngredient): RecipeLineDto {
    return {
      ingredientId: line.ingredientId,
      ingredientName: line.ingredient.name as unknown as TranslatedText,
      unit: line.ingredient.unit,
      quantity: line.quantity,
      instructions: line.instructions as unknown as TranslatedText,
    };
  }
}
