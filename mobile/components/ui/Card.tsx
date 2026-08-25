import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { radius as radiusTokens, useTheme } from '../../lib/theme';

type CardTone = 'surface' | 'muted' | 'dark' | 'accent' | 'glow';

interface CardProps extends PropsWithChildren {
  tone?: CardTone;
  padding?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, tone = 'surface', padding, radius: cornerRadius, style }: CardProps) {
  const { color } = useTheme();
  const r = cornerRadius ?? radiusTokens.xl;
  const backgroundColor = tone === 'accent' || tone === 'muted' || tone === 'dark'
    ? color.surfaceMuted
    : color.surface;

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor,
          borderColor: color.border,
          borderRadius: r,
          padding: padding ?? 16,
          shadowColor: 'transparent',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    shadowOpacity: 0,
    elevation: 0,
    overflow: 'hidden',
  },
});
