import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateIngredientDto } from './ingredient/create-ingredient.dto';
import { AddRecipeIngredientDto } from './recipe/add-recipe-ingredient.dto';
import { TranslatedTextDto } from './translated-text.dto';

describe('bilingual (en/ro) validation', () => {
  it('accepts a value with both en and ro', async () => {
    const dto = plainToInstance(TranslatedTextDto, {
      en: 'Lime juice',
      ro: 'Suc de lămâie',
    });

    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects a value missing en', async () => {
    const dto = plainToInstance(TranslatedTextDto, { ro: 'Suc de lămâie' });

    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'en')).toBe(true);
  });

  it('rejects a value missing ro', async () => {
    const dto = plainToInstance(TranslatedTextDto, { en: 'Lime juice' });

    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'ro')).toBe(true);
  });

  it('rejects an empty string for either language', async () => {
    const dto = plainToInstance(TranslatedTextDto, { en: '', ro: '' });

    const errors = await validate(dto);

    expect(errors.map((e) => e.property).sort()).toEqual(['en', 'ro']);
  });

  it('rejects creating an ingredient whose name is missing a language', async () => {
    const dto = plainToInstance(CreateIngredientDto, {
      name: { en: 'Lime juice' },
      unit: 'ml',
    });

    const errors = await validate(dto);

    const nameError = errors.find((e) => e.property === 'name');
    expect(nameError?.children?.some((c) => c.property === 'ro')).toBe(true);
  });

  it('rejects a recipe line whose instructions are missing a language', async () => {
    const dto = plainToInstance(AddRecipeIngredientDto, {
      ingredientId: 'ingredient-1',
      quantity: 30,
      instructions: { ro: 'Se toarnă peste gheață' },
    });

    const errors = await validate(dto);

    const instructionsError = errors.find((e) => e.property === 'instructions');
    expect(instructionsError?.children?.some((c) => c.property === 'en')).toBe(
      true,
    );
  });

  it('accepts a fully translated ingredient', async () => {
    const dto = plainToInstance(CreateIngredientDto, {
      name: { en: 'Lime juice', ro: 'Suc de lămâie' },
      unit: 'ml',
    });

    expect(await validate(dto)).toHaveLength(0);
  });
});
