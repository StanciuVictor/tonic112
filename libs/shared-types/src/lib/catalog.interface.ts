export const DrinkCategory = {
  cocktail: 'cocktail',
  mocktail: 'mocktail',
  shot: 'shot',
  beer: 'beer',
  wine: 'wine',
  champagne: 'champagne',
  spirit: 'spirit',
  liqueur: 'liqueur',
  non_alcoholic: 'non_alcoholic',
  hot_drink: 'hot_drink',
} as const;
export type DrinkCategory = (typeof DrinkCategory)[keyof typeof DrinkCategory];

/** Bilingual (English/Romanian) admin-managed content — see architecture-and-product-spec.md Section 9. */
export interface TranslatedText {
  en: string;
  ro: string;
}

export interface DrinkDto {
  id: string;
  name: string;
  description: string;
  category: DrinkCategory;
  imageUrl: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IngredientDto {
  id: string;
  name: TranslatedText;
  unit: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecipeLineDto {
  ingredientId: string;
  ingredientName: TranslatedText;
  unit: string;
  quantity: number;
  instructions: TranslatedText;
}

export interface DrinkDetailDto extends DrinkDto {
  recipe: RecipeLineDto[];
}

export interface CreateDrinkRequest {
  name: string;
  description: string;
  category: DrinkCategory;
  imageUrl?: string;
  active?: boolean;
}

export interface UpdateDrinkRequest {
  name?: string;
  description?: string;
  category?: DrinkCategory;
  imageUrl?: string;
  active?: boolean;
}

export interface CreateIngredientRequest {
  name: TranslatedText;
  unit: string;
}

export interface UpdateIngredientRequest {
  name?: TranslatedText;
  unit?: string;
}

export interface AddRecipeIngredientRequest {
  ingredientId: string;
  quantity: number;
  instructions: TranslatedText;
}

export interface UpdateRecipeIngredientRequest {
  quantity?: number;
  instructions?: TranslatedText;
}
