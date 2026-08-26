import { Animated, StyleSheet } from 'react-native';
import { useAnimatedThemeColor } from '../../lib/theme';

// The app's single visual identity: a fixed vertical gradient from an icy
// near-white blue down to midnight navy, rendered behind every screen so
// glass cards read as embedded in it rather than pasted on top. Fully
// covers the screen, so animating this alone is enough to make the whole
// background crossfade smoothly on a theme change.
export function AtmosphereBackground() {
  const backgroundColor = useAnimatedThemeColor('background');
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor }]} />
  );
}
