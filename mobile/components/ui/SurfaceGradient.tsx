import { LinearGradient, Rect, Stop, Svg } from 'react-native-svg';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

interface SurfaceGradientProps {
  colors: [string, string];
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function SurfaceGradient({ colors, children, style }: SurfaceGradientProps) {
  return (
    <View style={[styles.container, style]}>
      <Svg pointerEvents="none" style={StyleSheet.absoluteFill}>
        <LinearGradient id="surface-gradient" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={colors[0]} stopOpacity="1" />
          <Stop offset="1" stopColor={colors[1]} stopOpacity="1" />
        </LinearGradient>
        <RectFill />
      </Svg>
      {children}
    </View>
  );
}

function RectFill() {
  return <Rect x="0" y="0" width="100%" height="100%" fill="url(#surface-gradient)" />;
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
