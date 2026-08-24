import { Stack } from 'expo-router';
import { useTheme } from '../../../lib/theme';

export default function NotificationsStackLayout() {
  const { color } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: color.canvas },
      }}
    />
  );
}
