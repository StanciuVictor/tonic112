import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { DrinkCategory } from '@tonic112/shared-types';
import { Button } from '../components/button';
import { Card } from '../components/card';
import { CategorySwatch } from '../components/category-swatch';
import { DrinkIcon } from '../components/drink-icon';
import { HeaderBand } from '../components/header-band';
import { Toast } from '../components/toast';
import * as catalogClient from '../lib/catalog-client';
import { catalogKeys } from '../lib/catalog-query-keys';
import { goHome } from '../lib/navigation';
import { usePartyAccessToken } from '../lib/use-party-access-token';
import { usePartyStore } from '../store/party-store';
import {
  categoryColors,
  colors,
  fonts,
  fontSizes,
  spacing,
} from '../theme/tokens';

const ALL_CATEGORIES = Object.values(DrinkCategory);
const FILTER_ALL = 'all' as const;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

export default function MenuScreen() {
  const session = usePartyStore((s) => s.session);
  const token = usePartyAccessToken();
  const [filter, setFilter] = useState<DrinkCategory | typeof FILTER_ALL>(
    FILTER_ALL,
  );

  useEffect(() => {
    if (!session) {
      goHome();
    }
  }, [session]);

  const drinksQuery = useQuery({
    queryKey: catalogKeys.drinks,
    queryFn: () => catalogClient.fetchDrinks(token as string),
    enabled: !!token,
  });

  if (!session) {
    return null;
  }

  const drinks = (drinksQuery.data ?? []).filter(
    (d) => filter === FILTER_ALL || d.category === filter,
  );

  return (
    <View style={styles.container}>
      <HeaderBand accent="teal" onBackPress={() => router.back()}>
        <Text style={styles.title}>Menu</Text>
        <Text style={styles.subtitle}>Party {session.party.code}</Text>
      </HeaderBand>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        <Button
          variant="pill"
          selected={filter === FILTER_ALL}
          onPress={() => setFilter(FILTER_ALL)}
        >
          All
        </Button>
        {ALL_CATEGORIES.map((c) => (
          <Button
            key={c}
            variant="pill"
            selected={filter === c}
            onPress={() => setFilter(c)}
          >
            {categoryColors[c].label}
          </Button>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content}>
        {drinksQuery.isPending && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.accent.teal} />
          </View>
        )}
        {drinksQuery.error && (
          <Toast variant="error" message={errorMessage(drinksQuery.error)} />
        )}
        {!drinksQuery.isPending &&
          !drinksQuery.error &&
          drinks.length === 0 && (
            <Text style={styles.emptyText}>
              No drinks in this category yet.
            </Text>
          )}
        <View style={styles.list}>
          {drinks.map((drink) => (
            <Pressable
              key={drink.id}
              onPress={() => router.push(`/menu/${drink.id}`)}
              testID={`drink-card-${drink.id}`}
            >
              <Card style={styles.row}>
                <DrinkIcon
                  imageUrl={drink.imageUrl}
                  categoryColor={categoryColors[drink.category].swatch}
                  size="lg"
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
                    </Text>
                  </View>
                  <Text style={styles.rowDescription} numberOfLines={2}>
                    {drink.description}
                  </Text>
                </View>
              </Card>
            </Pressable>
          ))}
        </View>
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
  subtitle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.surface,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  content: {
    padding: spacing.xl,
    paddingTop: 0,
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
  rowDescription: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.text.mutedAlt,
  },
});
