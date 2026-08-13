import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../lib/theme';

export function Divider() {
  const { color } = useTheme();
  return <View style={[styles.divider, { backgroundColor: color.border }]} />;
}

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
  },
});
