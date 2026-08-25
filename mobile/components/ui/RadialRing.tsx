import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { fontFamily, fontSize, useTheme } from '../../lib/theme';

interface RadialRingProps {
  ratio: number; // 0-1, portion of the ring drawn in the accent color
  size?: number;
  strokeWidth?: number;
  centerValue: string;
  centerLabel: string | string[];
}

// The "radial allocation" motif from the brief, put to real use here as a
// paid-vs-outstanding ring instead of a decorative portfolio-allocation chart.
export function RadialRing({ ratio, size = 136, strokeWidth = 10, centerValue, centerLabel }: RadialRingProps) {
  const { color } = useTheme();
  const clamped = Math.min(1, Math.max(0, ratio));
  const radiusPx = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radiusPx;
  const segmentCount = 5;
  const segmentGap = 9;
  const segmentLength = (circumference - segmentGap * segmentCount) / segmentCount;
  const activeSegments = Math.round(clamped * segmentCount);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radiusPx}
          stroke={color.borderStrong}
          strokeWidth={strokeWidth}
          strokeDasharray={`${segmentLength} ${segmentGap}`}
          fill="none"
        />
        {Array.from({ length: activeSegments }, (_, index) => (
          <Circle
            key={index}
            cx={size / 2}
            cy={size / 2}
            r={radiusPx}
            stroke={color.accent}
            strokeWidth={strokeWidth}
            strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
            strokeDashoffset={-(index * (segmentLength + segmentGap))}
            strokeLinecap="butt"
            fill="none"
            rotation={-90}
            origin={`${size / 2}, ${size / 2}`}
          />
        ))}
      </Svg>
      <View style={styles.centerText}>
        <Text style={[styles.value, { color: color.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>
          {centerValue}
        </Text>
        {(Array.isArray(centerLabel) ? centerLabel : [centerLabel]).map((line) => (
          <Text key={line} style={[styles.label, { color: color.textSecondary }]} numberOfLines={1}>
            {line}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  value: {
    fontFamily: fontFamily.serif,
    fontSize: 30,
  },
  label: {
    fontFamily: fontFamily.semibold,
    fontSize: 9.5,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: 4,
  },
});
