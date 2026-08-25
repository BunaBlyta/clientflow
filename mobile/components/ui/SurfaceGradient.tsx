import { LinearGradient, Rect, Stop, Svg } from 'react-native-svg';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { radius as radiusTokens, useTheme } from '../../lib/theme';

interface SurfaceGradientProps {
  colors: [string, string];
  children: ReactNode;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

export function SurfaceGradient({ colors, children, radius: cornerRadius, style }: SurfaceGradientProps) {
  const { color } = useTheme();
  const r = cornerRadius ?? radiusTokens.xl;
  const gradientId = `surface-gradient-${colors[0]}-${colors[1]}`.replace(/[^a-zA-Z0-9-]/g, '');
  return (
    <View
      style={[
        styles.base,
        { borderRadius: r, borderColor: color.border, backgroundColor: colors[0], shadowColor: 'transparent' },
        style,
      ]}
    >
      <Svg pointerEvents="none" style={StyleSheet.absoluteFill}>
        <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={colors[0]} stopOpacity="1" />
          <Stop offset="1" stopColor={colors[1]} stopOpacity="1" />
        </LinearGradient>
        <Rect x="0" y="0" width="100%" height="100%" rx={r} ry={r} fill={`url(#${gradientId})`} />
      </Svg>
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
