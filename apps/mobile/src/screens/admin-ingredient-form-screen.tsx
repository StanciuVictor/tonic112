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
import { Button } from '../components/button';
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

export default function AdminIngredientFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();

  // No single-ingredient GET endpoint exists — the admin ingredient list is
  // expected to stay small for a home-party menu, and reusing the shared
  // `catalogKeys.ingredients` cache here means this screen is often
  // instant (no refetch) if the list screen was just visited.
  const ingredientsQuery = useQuery({
    queryKey: catalogKeys.ingredients,
    queryFn: () => catalogClient.fetchIngredients(token as string),
    enabled: !!token && isEditing,
  });
  const existing = ingredientsQuery.data?.find((i) => i.id === id);

  const [nameEn, setNameEn] = useState('');
  const [nameRo, setNameRo] = useState('');
  const [unit, setUnit] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (existing) {
      setNameEn(existing.name.en);
      setNameRo(existing.name.ro);
      setUnit(existing.unit);
    }
  }, [existing]);

  const createIngredient = useMutation({
    mutationFn: () =>
      catalogClient.createIngredient(
        { name: { en: nameEn.trim(), ro: nameRo.trim() }, unit: unit.trim() },
        token as string,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.ingredients });
      router.back();
    },
  });

  const updateIngredient = useMutation({
    mutationFn: () =>
      catalogClient.updateIngredient(
        id as string,
        { name: { en: nameEn.trim(), ro: nameRo.trim() }, unit: unit.trim() },
        token as string,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.ingredients });
      router.back();
    },
  });

  if (!user?.isAdmin) {
    return <Redirect href="/profile" />;
  }

  const saving = createIngredient.isPending || updateIngredient.isPending;
  const mutationError = createIngredient.error ?? updateIngredient.error;
  const notFound = isEditing && !ingredientsQuery.isPending && !existing;

  const handleSave = () => {
    if (!token) {
      return;
    }
    if (!nameEn.trim() || !nameRo.trim() || !unit.trim()) {
      setFormError('Name (English and Romanian) and unit are all required.');
      return;
    }
    setFormError(null);
    if (isEditing) {
      updateIngredient.mutate();
    } else {
      createIngredient.mutate();
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBand accent="coral" onBackPress={() => router.back()}>
        <Text style={styles.title}>
          {isEditing ? 'Edit Ingredient' : 'Add Ingredient'}
        </Text>
      </HeaderBand>
      <ScrollView contentContainerStyle={styles.content}>
        {isEditing && ingredientsQuery.isPending && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.accent.coral} />
          </View>
        )}
        {notFound && <Toast variant="error" message="Ingredient not found." />}
        {(formError || mutationError) && (
          <Toast
            variant="error"
            message={formError ?? errorMessage(mutationError)}
          />
        )}
        {(!isEditing || (!ingredientsQuery.isPending && existing)) && (
          <>
            <View style={styles.halfRow}>
              <View style={styles.half}>
                <Input
                  label="Name (English)"
                  value={nameEn}
                  onChangeText={setNameEn}
                />
              </View>
              <View style={styles.half}>
                <Input
                  label="Name (Romanian)"
                  value={nameRo}
                  onChangeText={setNameRo}
                />
              </View>
            </View>
            <Input
              label="Unit"
              value={unit}
              onChangeText={setUnit}
              placeholder="e.g. ml, oz, dash"
            />
            <Button
              onPress={handleSave}
              loading={saving}
              disabled={saving}
              testID="save-ingredient-button"
            >
              {isEditing ? 'Save Changes' : 'Create Ingredient'}
            </Button>
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
  halfRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  half: {
    flex: 1,
  },
});
