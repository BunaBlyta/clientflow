import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../lib/theme';

export function Divider() {
  useTheme();
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'transparent',
  },
});
