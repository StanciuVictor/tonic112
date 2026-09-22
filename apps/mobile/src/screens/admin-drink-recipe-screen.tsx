import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
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
import { HeaderBand } from '../components/header-band';
import { Input } from '../components/input';
import { Toast } from '../components/toast';
import * as catalogClient from '../lib/catalog-client';
import { catalogKeys } from '../lib/catalog-query-keys';
import { useAuthStore } from '../store/auth-store';
import { colors, fonts, fontSizes, spacing } from '../theme/tokens';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

export default function AdminDrinkRecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();

  const drinkQuery = useQuery({
    queryKey: catalogKeys.drink(id ?? 'new'),
    queryFn: () =>
      catalogClient.fetchDrinkDetail(id as string, token as string),
    enabled: !!token && !!id,
  });
  const ingredientsQuery = useQuery({
    queryKey: catalogKeys.ingredients,
    queryFn: () => catalogClient.fetchIngredients(token as string),
    enabled: !!token,
  });

  const [addingIngredientId, setAddingIngredientId] = useState<string | null>(
    null,
  );
  const [quantity, setQuantity] = useState('');
  const [instructionsEn, setInstructionsEn] = useState('');
  const [instructionsRo, setInstructionsRo] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const addLine = useMutation({
    mutationFn: () =>
      catalogClient.addRecipeIngredient(
        id as string,
        {
          ingredientId: addingIngredientId as string,
          quantity: Number(quantity),
          instructions: {
            en: instructionsEn.trim(),
            ro: instructionsRo.trim(),
          },
        },
        token as string,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: catalogKeys.drink(id as string),
      });
      setAddingIngredientId(null);
    },
  });

  const removeLine = useMutation({
    mutationFn: (ingredientId: string) =>
      catalogClient.removeRecipeIngredient(
        id as string,
        ingredientId,
        token as string,
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: catalogKeys.drink(id as string),
      }),
  });

  if (!user?.isAdmin) {
    return <Redirect href="/profile" />;
  }

  const handleStartAdd = (ingredientId: string) => {
    setAddingIngredientId(ingredientId);
    setQuantity('');
    setInstructionsEn('');
    setInstructionsRo('');
    setFormError(null);
  };

  const handleConfirmAdd = () => {
    const parsedQuantity = Number(quantity);
    if (
      !quantity.trim() ||
      Number.isNaN(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      setFormError('Enter a valid quantity.');
      return;
    }
    if (!instructionsEn.trim() || !instructionsRo.trim()) {
      setFormError('Instructions are required in both English and Romanian.');
      return;
    }
    setFormError(null);
    addLine.mutate();
  };

  const recipe = drinkQuery.data?.recipe ?? [];
  const ingredients = ingredientsQuery.data ?? [];
  const availableIngredients = ingredients.filter(
    (i) => !recipe.some((line) => line.ingredientId === i.id),
  );
  const addingIngredient = ingredients.find((i) => i.id === addingIngredientId);
  const isLoading = drinkQuery.isPending || ingredientsQuery.isPending;

  return (
    <View style={styles.container}>
      <HeaderBand accent="coral" onBackPress={() => router.back()}>
        <Text style={styles.title}>
          {drinkQuery.data ? `${drinkQuery.data.name} — Recipe` : 'Recipe'}
        </Text>
      </HeaderBand>
      <ScrollView contentContainerStyle={styles.content}>
        {isLoading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.accent.coral} />
          </View>
        )}
        {drinkQuery.error && (
          <Toast variant="error" message={errorMessage(drinkQuery.error)} />
        )}
        {(formError || addLine.error || removeLine.error) && (
          <Toast
            variant="error"
            message={
              formError ?? errorMessage(addLine.error ?? removeLine.error)
            }
          />
        )}

        {!isLoading && !drinkQuery.error && (
          <>
            {recipe.length === 0 && (
              <Text style={styles.emptyText}>No ingredients yet.</Text>
            )}
            <View style={styles.list}>
              {recipe.map((line) => (
                <Card key={line.ingredientId} style={styles.recipeRow}>
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowName}>
                      {line.ingredientName.en} — {line.quantity}
                      {line.unit}
                    </Text>
                    <Text style={styles.rowMeta}>{line.instructions.en}</Text>
                  </View>
                  <Button
                    variant="link"
                    onPress={() => removeLine.mutate(line.ingredientId)}
                    disabled={removeLine.isPending}
                    testID={`remove-recipe-line-${line.ingredientId}`}
                  >
                    Remove
                  </Button>
                </Card>
              ))}
            </View>

            {availableIngredients.length > 0 && (
              <>
                <Text style={styles.subLabel}>Add an ingredient</Text>
                <View style={styles.pillRow}>
                  {availableIngredients.map((ingredient) => (
                    <Button
                      key={ingredient.id}
                      variant="pill"
                      selected={addingIngredientId === ingredient.id}
                      onPress={() => handleStartAdd(ingredient.id)}
                    >
                      {ingredient.name.en}
                    </Button>
                  ))}
                </View>
              </>
            )}

            {addingIngredient && (
              <Card style={styles.addForm}>
                <Input
                  label={`Quantity (${addingIngredient.unit})`}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                />
                <View style={styles.halfRow}>
                  <View style={styles.half}>
                    <Input
                      label="Instructions (English)"
                      value={instructionsEn}
                      onChangeText={setInstructionsEn}
                      multiline
                    />
                  </View>
                  <View style={styles.half}>
                    <Input
                      label="Instructions (Romanian)"
                      value={instructionsRo}
                      onChangeText={setInstructionsRo}
                      multiline
                    />
                  </View>
                </View>
                <Button
                  onPress={handleConfirmAdd}
                  loading={addLine.isPending}
                  disabled={addLine.isPending}
                  testID="confirm-add-recipe-ingredient-button"
                >
                  Add to recipe
                </Button>
                <Button
                  variant="secondary"
                  onPress={() => setAddingIngredientId(null)}
                  disabled={addLine.isPending}
                >
                  Cancel
                </Button>
              </Card>
            )}
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
  emptyText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.text.muted,
  },
  list: {
    gap: spacing.sm,
  },
  recipeRow: {
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
  rowMeta: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.text.muted,
  },
  subLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  addForm: {
    gap: spacing.sm,
  },
  halfRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  half: {
    flex: 1,
  },
});
