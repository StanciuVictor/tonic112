import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Card } from '../components/card';
import { CategorySwatch } from '../components/category-swatch';
import { DrinkIcon } from '../components/drink-icon';
import { HeaderBand } from '../components/header-band';
import { Toast } from '../components/toast';
import * as catalogClient from '../lib/catalog-client';
import { catalogKeys } from '../lib/catalog-query-keys';
import { usePartyAccessToken } from '../lib/use-party-access-token';
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

export default function DrinkDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const token = usePartyAccessToken();

  const drinkQuery = useQuery({
    queryKey: catalogKeys.drink(id ?? 'new'),
    queryFn: () =>
      catalogClient.fetchDrinkDetail(id as string, token as string),
    enabled: !!token && !!id,
  });

  const drink = drinkQuery.data;

  return (
    <View style={styles.container}>
      <HeaderBand accent="teal" onBackPress={() => router.back()}>
        <Text style={styles.title}>{drink?.name ?? 'Drink'}</Text>
      </HeaderBand>
      <ScrollView contentContainerStyle={styles.content}>
        {drinkQuery.isPending && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.accent.teal} />
          </View>
        )}
        {drinkQuery.error && (
          <Toast variant="error" message={errorMessage(drinkQuery.error)} />
        )}
        {drink && (
          <>
            <View style={styles.iconRow}>
              <DrinkIcon
                imageUrl={drink.imageUrl}
                categoryColor={categoryColors[drink.category].swatch}
                size="lg"
              />
              <View style={styles.tagRow}>
                <CategorySwatch
                  color={categoryColors[drink.category].swatch}
                  size="sm"
                />
                <Text style={styles.tagLabel}>
                  {categoryColors[drink.category].label}
                </Text>
              </View>
            </View>

            <Text style={styles.description}>{drink.description}</Text>

            <Text style={styles.sectionTitle}>Recipe</Text>
            {drink.recipe.length === 0 && (
              <Text style={styles.emptyText}>
                No recipe details yet for this drink.
              </Text>
            )}
            <View style={styles.list}>
              {drink.recipe.map((line) => (
                <Card key={line.ingredientId} style={styles.recipeRow}>
                  <Text style={styles.ingredientLine}>
                    {line.ingredientName.en} — {line.quantity}
                    {line.unit}
                  </Text>
                  <Text style={styles.instructions}>
                    {line.instructions.en}
                  </Text>
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
  iconRow: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  tagLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.text.muted,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.text.primary,
  },
  sectionTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.lg,
    color: colors.text.primary,
    marginTop: spacing.md,
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
    gap: 4,
  },
  ingredientLine: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.text.primary,
  },
  instructions: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.text.muted,
  },
});
