import { StyleSheet, View } from 'react-native';
import { color } from '../../lib/theme';

export function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: color.border,
  },
});
