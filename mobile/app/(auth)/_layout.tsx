import { Stack } from 'expo-router';
import { useTheme, fontFamily, fontSize } from '../../lib/theme';

export default function AuthLayout() {
  const { color } = useTheme();
  return (
    <Stack
      initialRouteName="login"
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: color.background },
        headerShadowVisible: false,
        headerTintColor: color.accent,
        headerBackTitle: '',
        headerTitleStyle: {
          fontFamily: fontFamily.semibold,
          fontSize: fontSize.sectionTitle,
          color: color.textPrimary,
        },
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="verify-code" options={{ title: '' }} />
      <Stack.Screen name="set-password" options={{ title: '' }} />
      <Stack.Screen name="forgot-password" options={{ title: '' }} />
      <Stack.Screen name="request-status" options={{ title: '' }} />
    </Stack>
  );
}
