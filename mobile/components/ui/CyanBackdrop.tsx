import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useTheme } from '../../lib/theme';

export function CyanBackdrop() {
  const { color } = useTheme();
  const landingCyan = color.accent;
  const isDark = color.background === '#08090A';

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="clientflow-cyan-wash" x1="0%" y1="0%" x2="100%" y2="72%">
            <Stop offset="0%" stopColor={landingCyan} stopOpacity={isDark ? 0.18 : 0.34} />
            <Stop offset="42%" stopColor={landingCyan} stopOpacity={isDark ? 0.04 : 0.08} />
            <Stop offset="100%" stopColor={color.background} stopOpacity={0} />
          </LinearGradient>
          <LinearGradient id="clientflow-cyan-glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={landingCyan} stopOpacity={isDark ? 0.12 : 0.16} />
            <Stop offset="100%" stopColor={landingCyan} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#clientflow-cyan-wash)" />
        <Circle cx="100%" cy="0%" r={190} fill="url(#clientflow-cyan-glow)" />
        <Circle cx="-8%" cy="52%" r={150} fill={landingCyan} opacity={isDark ? 0.025 : 0.045} />
        <Circle cx="88%" cy="64%" r={86} fill={landingCyan} opacity={isDark ? 0.018 : 0.025} />
      </Svg>
    </View>
  );
}
