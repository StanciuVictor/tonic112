import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '../components/button';
import { Card } from '../components/card';
import { CategorySwatch } from '../components/category-swatch';
import { DrinkIcon } from '../components/drink-icon';
import { HeaderBand } from '../components/header-band';
import { Toast } from '../components/toast';
import * as catalogClient from '../lib/catalog-client';
import { catalogKeys } from '../lib/catalog-query-keys';
import { useAuthStore } from '../store/auth-store';
import {
  categoryColors,
  colors,
  fonts,
  fontSizes,
  spacing,
} from '../theme/tokens';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

export default function AdminCatalogScreen() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();

  const drinksQuery = useQuery({
    queryKey: catalogKeys.drinks,
    queryFn: () => catalogClient.fetchDrinks(token as string),
    enabled: !!token,
  });
  const ingredientsQuery = useQuery({
    queryKey: catalogKeys.ingredients,
    queryFn: () => catalogClient.fetchIngredients(token as string),
    enabled: !!token,
  });

  const deleteDrink = useMutation({
    mutationFn: (id: string) => catalogClient.deleteDrink(id, token as string),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: catalogKeys.drinks }),
  });
  const deleteIngredient = useMutation({
    mutationFn: (id: string) =>
      catalogClient.deleteIngredient(id, token as string),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: catalogKeys.ingredients }),
  });

  const [confirmDrinkId, setConfirmDrinkId] = useState<string | null>(null);
  const [confirmIngredientId, setConfirmIngredientId] = useState<string | null>(
    null,
  );

  if (!user?.isAdmin) {
    return <Redirect href="/profile" />;
  }

  const isLoading = drinksQuery.isPending || ingredientsQuery.isPending;
  const loadError = drinksQuery.error ?? ingredientsQuery.error;
  const actionError = deleteDrink.error ?? deleteIngredient.error;
  const drinks = drinksQuery.data ?? [];
  const ingredients = ingredientsQuery.data ?? [];

  return (
    <View style={styles.container}>
      <HeaderBand accent="coral" onBackPress={() => router.back()}>
        <Text style={styles.title}>Manage Catalog</Text>
      </HeaderBand>
      <ScrollView contentContainerStyle={styles.content}>
        {isLoading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.accent.coral} />
          </View>
        )}
        {loadError && (
          <Toast variant="error" message={errorMessage(loadError)} />
        )}
        {actionError && (
          <Toast variant="error" message={errorMessage(actionError)} />
        )}
        {!isLoading && !loadError && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Drinks</Text>
              <Button
                variant="secondary"
                onPress={() => router.push('/admin/catalog/drinks/new')}
                testID="add-drink-button"
              >
                + Add drink
              </Button>
            </View>
            {drinks.length === 0 && (
              <Text style={styles.emptyText}>No drinks yet.</Text>
            )}
            <View style={styles.list}>
              {drinks.map((drink) => (
                <Card key={drink.id} style={styles.row}>
                  <DrinkIcon
                    imageUrl={drink.imageUrl}
                    categoryColor={categoryColors[drink.category].swatch}
                    size="md"
                  />
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowName}>{drink.name}</Text>
                    <View style={styles.tagRow}>
                      <CategorySwatch
                        color={categoryColors[drink.category].swatch}
                        size="sm"
                      />
                      <Text style={styles.rowMeta}>
                        {categoryColors[drink.category].label}
                        {!drink.active ? ' · Hidden' : ''}
                      </Text>
                    </View>
                  </View>
                  {confirmDrinkId === drink.id ? (
                    <>
                      <Button
                        variant="link"
                        onPress={() =>
                          deleteDrink.mutate(drink.id, {
                            onSettled: () => setConfirmDrinkId(null),
                          })
                        }
                        disabled={deleteDrink.isPending}
                        testID={`confirm-delete-drink-${drink.id}`}
                      >
                        {deleteDrink.isPending ? 'Deleting…' : 'Confirm'}
                      </Button>
                      <Button
                        variant="link"
                        onPress={() => setConfirmDrinkId(null)}
                        disabled={deleteDrink.isPending}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="link"
                        onPress={() =>
                          router.push(`/admin/catalog/drinks/${drink.id}`)
                        }
                        testID={`edit-drink-${drink.id}`}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="link"
                        onPress={() => setConfirmDrinkId(drink.id)}
                        testID={`delete-drink-${drink.id}`}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </Card>
              ))}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              <Button
                variant="secondary"
                onPress={() => router.push('/admin/catalog/ingredients/new')}
                testID="add-ingredient-button"
              >
                + Add ingredient
              </Button>
            </View>
            {ingredients.length === 0 && (
              <Text style={styles.emptyText}>No ingredients yet.</Text>
            )}
            <View style={styles.list}>
              {ingredients.map((ingredient) => (
                <Card key={ingredient.id} style={styles.row}>
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowName}>{ingredient.name.en}</Text>
                    <Text style={styles.rowMeta}>{ingredient.unit}</Text>
                  </View>
                  {confirmIngredientId === ingredient.id ? (
                    <>
                      <Button
                        variant="link"
                        onPress={() =>
                          deleteIngredient.mutate(ingredient.id, {
                            onSettled: () => setConfirmIngredientId(null),
                          })
                        }
                        disabled={deleteIngredient.isPending}
                        testID={`confirm-delete-ingredient-${ingredient.id}`}
                      >
                        {deleteIngredient.isPending ? 'Deleting…' : 'Confirm'}
                      </Button>
                      <Button
                        variant="link"
                        onPress={() => setConfirmIngredientId(null)}
                        disabled={deleteIngredient.isPending}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="link"
                        onPress={() =>
                          router.push(
                            `/admin/catalog/ingredients/${ingredient.id}`,
                          )
                        }
                        testID={`edit-ingredient-${ingredient.id}`}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="link"
                        onPress={() => setConfirmIngredientId(ingredient.id)}
                        testID={`delete-ingredient-${ingredient.id}`}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </Card>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: colors.surface,
  },
  content: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  loadingBox: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.lg,
    color: colors.text.primary,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.text.muted,
  },
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowInfo: {
    flex: 1,
    gap: 4,
  },
  rowName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.text.primary,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  rowMeta: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.text.muted,
  },
});
