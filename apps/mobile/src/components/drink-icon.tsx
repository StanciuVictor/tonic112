import { Image, StyleSheet } from 'react-native';
import { radii } from '../theme/tokens';
import {
  CategorySwatch,
  CategorySwatchShape,
  CategorySwatchSize,
} from './category-swatch';

export interface DrinkIconProps {
  /** Stylized per-drink icon image. Falls back to a CategorySwatch when absent. */
  imageUrl?: string | null;
  categoryColor: string;
  shape?: CategorySwatchShape;
  size?: CategorySwatchSize;
}

const SIZES: Record<CategorySwatchSize, number> = {
  sm: 24,
  md: 36,
  lg: 48,
};

export function DrinkIcon({
  imageUrl,
  categoryColor,
  shape = 'circle',
  size = 'md',
}: DrinkIconProps) {
  if (!imageUrl) {
    return (
      <CategorySwatch color={categoryColor} shape={shape} size={size} />
    );
  }

  const dimension = SIZES[size];

  return (
    <Image
      source={{ uri: imageUrl }}
      style={[
        styles.image,
        {
          width: dimension,
          height: dimension,
          borderRadius: shape === 'circle' ? dimension / 2 : radii.sm,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    resizeMode: 'cover',
  },
});
