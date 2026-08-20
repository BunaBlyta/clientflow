import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../lib/theme';

export function CyanBackdrop() {
  const { color } = useTheme();
  const isDark = color.background === '#0B0B0B';

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Circle
          cx="100%"
          cy="0%"
          r={180}
          fill={color.accent}
          opacity={isDark ? 0.035 : 0.055}
        />
      </Svg>
    </View>
  );
}
