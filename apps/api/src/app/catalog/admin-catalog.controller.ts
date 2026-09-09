import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { DrinkDto, IngredientDto, RecipeLineDto } from '@tonic112/shared-types';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CatalogService } from './catalog.service';
import { AddRecipeIngredientDto } from './dto/recipe/add-recipe-ingredient.dto';
import { CreateDrinkDto } from './dto/drink/create-drink.dto';
import { CreateIngredientDto } from './dto/ingredient/create-ingredient.dto';
import { UpdateDrinkDto } from './dto/drink/update-drink.dto';
import { UpdateIngredientDto } from './dto/ingredient/update-ingredient.dto';
import { UpdateRecipeIngredientDto } from './dto/recipe/update-recipe-ingredient.dto';

@Controller('admin-catalog')
@UseGuards(AdminGuard)
export class AdminCatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Post('drinks')
  createDrink(@Body() dto: CreateDrinkDto): Promise<DrinkDto> {
    return this.catalogService.createDrink(dto);
  }

  @Patch('drinks/:id')
  updateDrink(
    @Param('id') id: string,
    @Body() dto: UpdateDrinkDto,
  ): Promise<DrinkDto> {
    return this.catalogService.updateDrink(id, dto);
  }

  @Delete('drinks/:id')
  deleteDrink(@Param('id') id: string): Promise<void> {
    return this.catalogService.deleteDrink(id);
  }

  @Get('ingredients')
  listIngredients(): Promise<IngredientDto[]> {
    return this.catalogService.listIngredients();
  }

  @Post('ingredients')
  createIngredient(@Body() dto: CreateIngredientDto): Promise<IngredientDto> {
    return this.catalogService.createIngredient(dto);
  }

  @Patch('ingredients/:id')
  updateIngredient(
    @Param('id') id: string,
    @Body() dto: UpdateIngredientDto,
  ): Promise<IngredientDto> {
    return this.catalogService.updateIngredient(id, dto);
  }

  @Delete('ingredients/:id')
  deleteIngredient(@Param('id') id: string): Promise<void> {
    return this.catalogService.deleteIngredient(id);
  }

  @Post('drinks/:id/ingredients')
  addRecipeIngredient(
    @Param('id') drinkId: string,
    @Body() dto: AddRecipeIngredientDto,
  ): Promise<RecipeLineDto> {
    return this.catalogService.addRecipeIngredient(drinkId, dto);
  }

  @Patch('drinks/:id/ingredients/:ingredientId')
  updateRecipeIngredient(
    @Param('id') drinkId: string,
    @Param('ingredientId') ingredientId: string,
    @Body() dto: UpdateRecipeIngredientDto,
  ): Promise<RecipeLineDto> {
    return this.catalogService.updateRecipeIngredient(
      drinkId,
      ingredientId,
      dto,
    );
  }

  @Delete('drinks/:id/ingredients/:ingredientId')
  removeRecipeIngredient(
    @Param('id') drinkId: string,
    @Param('ingredientId') ingredientId: string,
  ): Promise<void> {
    return this.catalogService.removeRecipeIngredient(drinkId, ingredientId);
  }
}
