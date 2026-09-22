import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { DrinkCategory } from '@tonic112/shared-types';
import { Button } from '../components/button';
import { HeaderBand } from '../components/header-band';
import { Input } from '../components/input';
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

const ALL_CATEGORIES = Object.values(DrinkCategory);

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

export default function AdminDrinkFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();

  const drinkQuery = useQuery({
    // The key only matters while enabled — placeholder'd here so create mode
    // (no id) never reads/writes another drink's cache entry.
    queryKey: catalogKeys.drink(id ?? 'new'),
    queryFn: () =>
      catalogClient.fetchDrinkDetail(id as string, token as string),
    enabled: !!token && isEditing,
  });

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<DrinkCategory>(
    DrinkCategory.cocktail,
  );
  const [imageUrl, setImageUrl] = useState('');
  const [active, setActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (drinkQuery.data) {
      setName(drinkQuery.data.name);
      setDescription(drinkQuery.data.description);
      setCategory(drinkQuery.data.category);
      setImageUrl(drinkQuery.data.imageUrl ?? '');
      setActive(drinkQuery.data.active);
    }
  }, [drinkQuery.data]);

  const createDrink = useMutation({
    mutationFn: () =>
      catalogClient.createDrink(
        {
          name: name.trim(),
          description: description.trim(),
          category,
          imageUrl: imageUrl.trim() || undefined,
          active,
        },
        token as string,
      ),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.drinks });
      router.replace(`/admin/catalog/drinks/${created.id}`);
    },
  });

  const updateDrink = useMutation({
    mutationFn: () =>
      catalogClient.updateDrink(
        id as string,
        {
          name: name.trim(),
          description: description.trim(),
          category,
          imageUrl: imageUrl.trim() || undefined,
          active,
        },
        token as string,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.drinks });
      if (id) {
        queryClient.invalidateQueries({ queryKey: catalogKeys.drink(id) });
      }
      router.back();
    },
  });

  if (!user?.isAdmin) {
    return <Redirect href="/profile" />;
  }

  const saving = createDrink.isPending || updateDrink.isPending;
  const mutationError = createDrink.error ?? updateDrink.error;

  const handleSave = () => {
    if (!token) {
      return;
    }
    if (!name.trim() || !description.trim()) {
      setFormError('Name and description are required.');
      return;
    }
    setFormError(null);
    if (isEditing) {
      updateDrink.mutate();
    } else {
      createDrink.mutate();
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBand accent="coral" onBackPress={() => router.back()}>
        <Text style={styles.title}>
          {isEditing ? 'Edit Drink' : 'Add Drink'}
        </Text>
      </HeaderBand>
      <ScrollView contentContainerStyle={styles.content}>
        {isEditing && drinkQuery.isPending && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.accent.coral} />
          </View>
        )}
        {drinkQuery.error && (
          <Toast variant="error" message={errorMessage(drinkQuery.error)} />
        )}
        {(formError || mutationError) && (
          <Toast
            variant="error"
            message={formError ?? errorMessage(mutationError)}
          />
        )}
        {(!isEditing || (!drinkQuery.isPending && !drinkQuery.error)) && (
          <>
            <Input label="Name" value={name} onChangeText={setName} />
            <Input
              label="Description"
              value={description}
              onChangeText={setDescription}
              multiline
            />
            <Input
              label="Image URL (optional)"
              value={imageUrl}
              onChangeText={setImageUrl}
              placeholder="https://…"
            />

            <Text style={styles.subLabel}>Category</Text>
            <View style={styles.pillRow}>
              {ALL_CATEGORIES.map((c) => (
                <Button
                  key={c}
                  variant="pill"
                  selected={category === c}
                  onPress={() => setCategory(c)}
                >
                  {categoryColors[c].label}
                </Button>
              ))}
            </View>

            <Text style={styles.subLabel}>Visibility</Text>
            <View style={styles.pillRow}>
              <Button
                variant="pill"
                selected={active}
                onPress={() => setActive(true)}
              >
                Visible on menu
              </Button>
              <Button
                variant="pill"
                selected={!active}
                onPress={() => setActive(false)}
              >
                Hidden
              </Button>
            </View>

            <Button
              onPress={handleSave}
              loading={saving}
              disabled={saving}
              testID="save-drink-button"
            >
              {isEditing ? 'Save Changes' : 'Create Drink'}
            </Button>

            {isEditing && id && (
              <Button
                variant="link"
                onPress={() =>
                  router.push(`/admin/catalog/drinks/${id}/recipe`)
                }
                testID="manage-recipe-link"
              >
                Manage Recipe →
              </Button>
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
  subLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.text.primary,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
