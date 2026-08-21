import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { radii } from '../theme/tokens';

export type CategorySwatchShape = 'circle' | 'rounded-square';
export type CategorySwatchSize = 'sm' | 'md' | 'lg';

export interface CategorySwatchProps {
  color: string;
  shape?: CategorySwatchShape;
  size?: CategorySwatchSize;
  /** Optional content rendered centered inside the swatch (e.g. a small icon). */
  children?: ReactNode;
}

const SIZES: Record<CategorySwatchSize, number> = {
  sm: 24,
  md: 36,
  lg: 48,
};

export function CategorySwatch({
  color,
  shape = 'circle',
  size = 'md',
  children,
}: CategorySwatchProps) {
  const dimension = SIZES[size];

  return (
    <View
      style={[
        styles.swatch,
        {
          width: dimension,
          height: dimension,
          backgroundColor: color,
          borderRadius: shape === 'circle' ? dimension / 2 : radii.sm,
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  swatch: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
