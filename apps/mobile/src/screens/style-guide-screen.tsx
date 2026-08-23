import { ReactNode, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  Button,
  ButtonProps,
  Card,
  CategorySwatch,
  DrinkIcon,
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

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

type CellState = 'Default' | 'Hover' | 'Pressed' | 'Disabled';

interface GalleryCell {
  state: CellState;
  /** oklch source value(s) driving this cell, shown as a caption for doc/code diffing. */
  oklch: string;
}

interface GalleryGroup {
  title: string;
  /** Props shared by every cell in this row (variant, band, tone, selected, icon…). */
  buttonProps: Partial<ButtonProps>;
  label?: string;
  cells: GalleryCell[];
  /** Renders the row on a colored band, for variants designed to sit on one. */
  band?: 'teal' | 'coral';
}

const GALLERY: GalleryGroup[] = [
  {
    title: 'Primary',
    buttonProps: { variant: 'primary' },
    label: 'Add to Order',
    cells: [
      { state: 'Default', oklch: 'oklch(68% 0.19 30)' },
      { state: 'Hover', oklch: 'oklch(62% 0.20 30)' },
      { state: 'Pressed', oklch: 'oklch(56% 0.19 30)' },
      { state: 'Disabled', oklch: 'oklch(88% 0.04 30)' },
    ],
  },
  {
    title: 'Secondary',
    buttonProps: { variant: 'secondary' },
    label: 'Continue as Guest',
    cells: [
      { state: 'Default', oklch: 'border/label oklch(68% 0.19 30)' },
      { state: 'Hover', oklch: 'fill oklch(96% 0.04 30)' },
      { state: 'Pressed', oklch: 'fill oklch(92% 0.06 30)' },
      { state: 'Disabled', oklch: 'border oklch(88% 0.02 90)' },
    ],
  },
  {
    title: 'On-header — teal band',
    buttonProps: { variant: 'onHeader', band: 'teal' },
    label: '+ Add',
    band: 'teal',
    cells: [
      { state: 'Default', oklch: 'label oklch(42% 0.13 190)' },
      { state: 'Hover', oklch: 'bg oklch(96% 0.015 190)' },
      { state: 'Pressed', oklch: 'bg oklch(92% 0.03 190)' },
      { state: 'Disabled', oklch: 'bg rgba(255,255,255,.35)' },
    ],
  },
  {
    title: 'On-header — coral band',
    buttonProps: { variant: 'onHeader', band: 'coral' },
    label: '+ Add',
    band: 'coral',
    cells: [
      { state: 'Default', oklch: 'label oklch(50% 0.17 30)' },
      { state: 'Hover', oklch: 'bg oklch(96% 0.02 30)' },
      { state: 'Pressed', oklch: 'bg oklch(92% 0.04 30)' },
      { state: 'Disabled', oklch: 'bg rgba(255,255,255,.35)' },
    ],
  },
  {
    title: 'Filter pill — unselected',
    buttonProps: { variant: 'pill', selected: false },
    label: 'Cocktail',
    cells: [
      { state: 'Default', oklch: 'bg white, shadow 0 2px 8px -4px rgba(0,0,0,.15)' },
      { state: 'Hover', oklch: 'bg oklch(96% 0.04 30)' },
      { state: 'Pressed', oklch: 'bg oklch(62% 0.20 30) — previews selected' },
    ],
  },
  {
    title: 'Filter pill — selected',
    buttonProps: { variant: 'pill', selected: true },
    label: 'Cocktail',
    cells: [
      { state: 'Default', oklch: 'bg oklch(68% 0.19 30)' },
      { state: 'Hover', oklch: 'bg oklch(62% 0.20 30)' },
      { state: 'Pressed', oklch: 'bg oklch(56% 0.19 30)' },
    ],
  },
  {
    title: 'Queue action — Claim/Start/Mark Ready',
    buttonProps: { variant: 'queue', tone: 'action' },
    label: 'Claim',
    cells: [
      { state: 'Default', oklch: 'reuses Primary: oklch(68% 0.19 30)' },
      { state: 'Hover', oklch: 'oklch(62% 0.20 30)' },
      { state: 'Pressed', oklch: 'oklch(56% 0.19 30)' },
      { state: 'Disabled', oklch: 'oklch(88% 0.04 30)' },
    ],
  },
  {
    title: 'Queue action — Cancel (ghost)',
    buttonProps: { variant: 'queue', tone: 'cancel' },
    label: 'Cancel',
    cells: [
      { state: 'Default', oklch: 'bg oklch(95% 0.008 90)' },
      { state: 'Hover', oklch: 'bg oklch(91% 0.01 90)' },
      { state: 'Pressed', oklch: 'bg oklch(87% 0.012 90)' },
      { state: 'Disabled', oklch: 'not specified in spec — dimmed via secondary’s disabled label tone' },
    ],
  },
  {
    title: 'Icon — back chevron / favorite',
    buttonProps: { variant: 'icon', icon: 'chevron-back' },
    cells: [
      { state: 'Default', oklch: 'stroke oklch(60% 0.03 90)' },
      { state: 'Hover', oklch: 'bg oklch(93% 0.008 90)' },
      { state: 'Pressed', oklch: 'no defined pressed bg — scale(0.97) is the feedback' },
      { state: 'Disabled', oklch: 'not specified — falls back to primary’s disabled tone' },
    ],
  },
  {
    title: 'Icon — favorite (selected/filled)',
    buttonProps: { variant: 'icon', icon: 'heart', selected: true },
    cells: [
      { state: 'Default', oklch: 'fill/stroke oklch(68% 0.19 30)' },
    ],
  },
  {
    title: 'Icon — quantity +/-',
    buttonProps: { variant: 'icon', size: 'compact', icon: 'add' },
    cells: [
      { state: 'Default', oklch: 'reuses Primary: oklch(68% 0.19 30)' },
      { state: 'Hover', oklch: 'oklch(62% 0.20 30)' },
      { state: 'Pressed', oklch: 'oklch(56% 0.19 30), scale(0.94)' },
      { state: 'Disabled', oklch: 'oklch(88% 0.04 30) — used at quantity 1' },
    ],
  },
  {
    title: 'Text / link',
    buttonProps: { variant: 'link' },
    label: 'Edit Recipe →',
    cells: [
      { state: 'Default', oklch: 'oklch(68% 0.19 30)' },
      { state: 'Hover', oklch: 'oklch(58% 0.19 30) + underline' },
      { state: 'Pressed', oklch: 'oklch(52% 0.18 30)' },
      { state: 'Disabled', oklch: 'oklch(75% 0.01 90)' },
    ],
  },
];

function GalleryRow({ group }: { group: GalleryGroup }) {
  return (
    <View style={styles.galleryGroup}>
      <Text style={styles.galleryGroupTitle}>{group.title}</Text>
      <View style={styles.galleryRow}>
        {group.cells.map((cell) => (
          <View
            key={cell.state}
            style={[
              styles.galleryCell,
              group.band && {
                backgroundColor: group.band === 'teal' ? colors.accent.teal : colors.accent.coral,
                borderRadius: 12,
              },
            ]}
          >
            <View style={styles.galleryCellButtonWrap}>
              <Button
                {...group.buttonProps}
                disabled={cell.state === 'Disabled'}
                forceState={
                  cell.state === 'Hover' ? 'hover' : cell.state === 'Pressed' ? 'pressed' : undefined
                }
                onPress={() => undefined}
              >
                {group.label}
              </Button>
            </View>
            <Text style={[styles.galleryCellLabel, group.band && { color: colors.surface }]}>
              {cell.state}
            </Text>
            <Text style={[styles.galleryCellOklch, group.band && { color: 'rgba(255,255,255,0.85)' }]}>
              {cell.oklch}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * Temporary showcase screen for reviewing every Epic 02 component and its
 * states in one place. Not part of the final app navigation — remove once
 * the design system has been reviewed and Epic 03 is underway.
 */
export default function StyleGuideScreen() {
  const [selectedPill, setSelectedPill] = useState('All');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <HeaderBand accent="teal">
        <Text style={styles.headerTitle}>Style Guide</Text>
      </HeaderBand>

      <Section title="Buttons — states gallery">
        {GALLERY.map((group) => (
          <GalleryRow key={group.title} group={group} />
        ))}
      </Section>

      <Section title="Buttons — live interaction">
        <View style={styles.row}>
          {(['All', 'Cocktail', 'Mocktail'] as const).map((label) => (
            <Button
              key={label}
              variant="pill"
              selected={selectedPill === label}
              onPress={() => setSelectedPill(label)}
            >
              {label}
            </Button>
          ))}
        </View>
        <View style={{ maxWidth: 320, gap: spacing.sm }}>
          <Button variant="primary" onPress={() => undefined}>
            Join Party
          </Button>
          <Button variant="secondary" onPress={() => undefined}>
            Log In
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
  galleryGroup: {
    gap: spacing.xs,
  },
  galleryGroupTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.text.mutedAlt,
  },
  galleryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  galleryCell: {
    width: 168,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  galleryCellButtonWrap: {
    minHeight: 48,
    justifyContent: 'center',
  },
  galleryCellLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.xs,
    color: colors.text.primary,
  },
  galleryCellOklch: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.text.muted,
  },
});
