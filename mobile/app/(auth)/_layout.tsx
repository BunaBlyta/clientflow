import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack initialRouteName="login" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="verify-code" />
      <Stack.Screen name="set-password" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="request-status" />
    </Stack>
  );
}
