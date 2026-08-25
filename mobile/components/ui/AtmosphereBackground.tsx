import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../lib/theme';

// The app's single visual identity: a fixed vertical gradient from an icy
// near-white blue down to midnight navy, rendered behind every screen so
// glass cards read as embedded in it rather than pasted on top.
export function AtmosphereBackground() {
  const { color } = useTheme();
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: color.background }]} />
  );
}
