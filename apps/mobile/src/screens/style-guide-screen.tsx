import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  Button,
  Card,
  CategorySwatch,
  DrinkIcon,
  FilterChip,
  HeaderBand,
  Input,
  StatusPill,
  Toast,
} from '../components';
import { OrderStatus, colors, fonts, fontSizes, spacing } from '../theme/tokens';

const ALL_STATUSES: OrderStatus[] = [
  'pending',
  'claimed',
  'preparing',
  'ready',
  'cancelled',
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const FILTER_CHIPS = ['All', 'Cocktail', 'Mocktail'] as const;

function FilterChipDemo() {
  const [selected, setSelected] = useState<string>('All');

  return (
    <View style={styles.row}>
      {FILTER_CHIPS.map((label) => (
        <FilterChip
          key={label}
          label={label}
          selected={selected === label}
          onPress={() => setSelected(label)}
        />
      ))}
    </View>
  );
}

/**
 * Temporary showcase screen for reviewing every Epic 02 component and its
 * states in one place. Not part of the final app navigation — remove once
 * the design system has been reviewed and Epic 03 is underway.
 */
export default function StyleGuideScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <HeaderBand accent="teal">
        <Text style={styles.headerTitle}>Style Guide</Text>
      </HeaderBand>

      <Section title="Buttons">
        <View style={styles.row}>
          <Button onPress={() => undefined}>Primary</Button>
          <Button variant="secondary" onPress={() => undefined}>
            Secondary
          </Button>
          <Button disabled onPress={() => undefined}>
            Disabled
          </Button>
        </View>
      </Section>

      <Section title="Card">
        <Card>
          <Text style={styles.bodyText}>
            Cards are the white, rounded, shadowed container used throughout
            the app.
          </Text>
        </Card>
      </Section>

      <Section title="Status Pill">
        <View style={styles.row}>
          {ALL_STATUSES.map((status) => (
            <StatusPill key={status} status={status} />
          ))}
        </View>
      </Section>

      <Section title="Filter Chip">
        <FilterChipDemo />
      </Section>

      <Section title="Category Swatch">
        <View style={styles.row}>
          <CategorySwatch color={colors.accent.coral} shape="circle" size="lg" />
          <CategorySwatch color={colors.accent.teal} shape="rounded-square" size="lg" />
          <CategorySwatch color={colors.accent.yellow} shape="circle" size="md" />
        </View>
      </Section>

      <Section title="Drink Icon (fallback — no icon generated yet)">
        <View style={styles.row}>
          <DrinkIcon categoryColor={colors.accent.coral} size="lg" />
          <DrinkIcon categoryColor={colors.accent.teal} shape="rounded-square" size="lg" />
        </View>
      </Section>

      <Section title="Header Band">
        <View style={{ gap: spacing.sm }}>
          <HeaderBand accent="teal">
            <Text style={styles.headerTitle}>Guest-facing header</Text>
          </HeaderBand>
          <HeaderBand accent="coral">
            <Text style={styles.headerTitle}>Bartender-facing header</Text>
          </HeaderBand>
        </View>
      </Section>

      <Section title="Input">
        <View style={{ gap: spacing.md }}>
          <Input label="Display name" placeholder="e.g. Alex" />
          <Input
            label="Email"
            placeholder="you@example.com"
            error="Please enter a valid email address"
          />
        </View>
      </Section>

      <Section title="Toast / inline feedback">
        <View style={{ gap: spacing.sm }}>
          <Toast variant="success" message="Order submitted" />
          <Toast variant="error" message="Promotion failed" />
          <Toast variant="warning" message="Connection lost — reconnecting…" />
        </View>
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  headerTitle: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: colors.surface,
  },
  section: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  sectionTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.text.primary,
  },
  bodyText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.text.primary,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignItems: 'center',
  },
});
