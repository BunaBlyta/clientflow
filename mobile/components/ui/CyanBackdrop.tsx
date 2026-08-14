import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useTheme } from '../../lib/theme';

export function CyanBackdrop() {
  const { color } = useTheme();
  const landingCyan = color.accent;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="clientflow-cyan-wash" x1="0%" y1="0%" x2="100%" y2="72%">
            <Stop offset="0%" stopColor={landingCyan} stopOpacity={0.4} />
            <Stop offset="42%" stopColor={landingCyan} stopOpacity={0.08} />
            <Stop offset="100%" stopColor={color.background} stopOpacity={0} />
          </LinearGradient>
          <LinearGradient id="clientflow-cyan-glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={landingCyan} stopOpacity={0.08} />
            <Stop offset="100%" stopColor={landingCyan} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#clientflow-cyan-wash)" />
        <Circle cx="100%" cy="0%" r={180} fill="url(#clientflow-cyan-glow)" />
        <Circle cx="-8%" cy="52%" r={140} fill={landingCyan} opacity={0.05} />
      </Svg>
    </View>
  );
}
