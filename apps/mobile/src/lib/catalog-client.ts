import {
  AddRecipeIngredientRequest,
  CreateDrinkRequest,
  CreateIngredientRequest,
  DrinkDetailDto,
  DrinkDto,
  IngredientDto,
  RecipeLineDto,
  UpdateDrinkRequest,
  UpdateIngredientRequest,
  UpdateRecipeIngredientRequest,
} from '@tonic112/shared-types';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api';

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (Array.isArray(body.message)) {
      return body.message.join(' ');
    }
    if (typeof body.message === 'string') {
      return body.message;
    }
  } catch {
    // Response body wasn't JSON — fall through to the generic message below.
  }
  return `Request failed with status ${response.status}`;
}

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

function jsonHeaders(token: string): Record<string, string> {
  return { 'Content-Type': 'application/json', ...authHeaders(token) };
}

export async function fetchDrinks(token: string): Promise<DrinkDto[]> {
  const response = await fetch(`${API_URL}/catalog`, {
    headers: authHeaders(token),
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return response.json();
}

export async function fetchDrinkDetail(
  id: string,
  token: string,
): Promise<DrinkDetailDto> {
  const response = await fetch(`${API_URL}/catalog/${id}`, {
    headers: authHeaders(token),
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return response.json();
}

export async function createDrink(
  dto: CreateDrinkRequest,
  token: string,
): Promise<DrinkDto> {
  const response = await fetch(`${API_URL}/admin-catalog/drinks`, {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify(dto),
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return response.json();
}

export async function updateDrink(
  id: string,
  dto: UpdateDrinkRequest,
  token: string,
): Promise<DrinkDto> {
  const response = await fetch(`${API_URL}/admin-catalog/drinks/${id}`, {
    method: 'PATCH',
    headers: jsonHeaders(token),
    body: JSON.stringify(dto),
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return response.json();
}

export async function deleteDrink(id: string, token: string): Promise<void> {
  const response = await fetch(`${API_URL}/admin-catalog/drinks/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
}

export async function fetchIngredients(
  token: string,
): Promise<IngredientDto[]> {
  const response = await fetch(`${API_URL}/admin-catalog/ingredients`, {
    headers: authHeaders(token),
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return response.json();
}

export async function createIngredient(
  dto: CreateIngredientRequest,
  token: string,
): Promise<IngredientDto> {
  const response = await fetch(`${API_URL}/admin-catalog/ingredients`, {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify(dto),
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return response.json();
}

export async function updateIngredient(
  id: string,
  dto: UpdateIngredientRequest,
  token: string,
): Promise<IngredientDto> {
  const response = await fetch(`${API_URL}/admin-catalog/ingredients/${id}`, {
    method: 'PATCH',
    headers: jsonHeaders(token),
    body: JSON.stringify(dto),
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return response.json();
}

export async function deleteIngredient(
  id: string,
  token: string,
): Promise<void> {
  const response = await fetch(`${API_URL}/admin-catalog/ingredients/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
}

export async function addRecipeIngredient(
  drinkId: string,
  dto: AddRecipeIngredientRequest,
  token: string,
): Promise<RecipeLineDto> {
  const response = await fetch(
    `${API_URL}/admin-catalog/drinks/${drinkId}/ingredients`,
    { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify(dto) },
  );
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return response.json();
}

export async function updateRecipeIngredient(
  drinkId: string,
  ingredientId: string,
  dto: UpdateRecipeIngredientRequest,
  token: string,
): Promise<RecipeLineDto> {
  const response = await fetch(
    `${API_URL}/admin-catalog/drinks/${drinkId}/ingredients/${ingredientId}`,
    { method: 'PATCH', headers: jsonHeaders(token), body: JSON.stringify(dto) },
  );
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return response.json();
}

export async function removeRecipeIngredient(
  drinkId: string,
  ingredientId: string,
  token: string,
): Promise<void> {
  const response = await fetch(
    `${API_URL}/admin-catalog/drinks/${drinkId}/ingredients/${ingredientId}`,
    { method: 'DELETE', headers: authHeaders(token) },
  );
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
}
