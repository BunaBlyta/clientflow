import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useTheme } from '../../lib/theme';

interface RadialGlowProps {
  cx?: string;
  cy?: string;
  radius?: number;
}

// A soft bloom of light behind a hero value, fading into the card's own
// navy floor — the "light passing through glass" moment from the brief.
export function RadialGlow({ cx = '30%', cy = '0%', radius = 0 }: RadialGlowProps) {
  const { color } = useTheme();
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="glow" cx={cx} cy={cy} r="85%">
            <Stop offset="0%" stopColor={color.glowStart} stopOpacity="0.55" />
            <Stop offset="45%" stopColor={color.glowStart} stopOpacity="0.18" />
            <Stop offset="100%" stopColor={color.glowEnd} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" rx={radius} ry={radius} fill="url(#glow)" />
      </Svg>
    </View>
  );
}
