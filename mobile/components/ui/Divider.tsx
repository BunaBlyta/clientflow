import { View } from 'react-native';
import { useTheme } from '../../lib/theme';

export function Divider() {
  const { color } = useTheme();
  return <View style={{ height: 1, backgroundColor: color.border }} />;
}
