import { Stack } from 'expo-router';
import { useTheme } from '../../lib/theme';

export default function AuthLayout() {
  const { color } = useTheme();
  return (
    <Stack
      initialRouteName="login"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: color.background },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="verify-code" />
      <Stack.Screen name="set-password" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="request-status" />
    </Stack>
  );
}
