import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { fontFamily, fontSize, useTheme } from '../../../lib/theme';

export default function ProjectsStackLayout() {
  const { color } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        animation: Platform.OS === 'web' ? 'none' : 'slide_from_right',
        contentStyle: { backgroundColor: color.canvas },
        headerTitle: '',
        headerBackVisible: true,
        headerBackButtonDisplayMode: 'minimal',
        headerStyle: { backgroundColor: color.canvas },
        headerShadowVisible: false,
        headerTintColor: color.textPrimary,
        headerTitleStyle: {
          fontFamily: fontFamily.semibold,
          fontSize: fontSize.sectionTitle,
          color: color.textPrimary,
        },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]/index" options={{ title: '' }} />
      <Stack.Screen name="[id]/notes" options={{ title: '' }} />
      <Stack.Screen name="[id]/invoices/index" options={{ title: '' }} />
      <Stack.Screen name="[id]/invoices/[invoiceId]/index" options={{ title: '' }} />
      <Stack.Screen
        name="[id]/invoices/[invoiceId]/checkout"
        options={{ presentation: 'modal' }}
      />
    </Stack>
  );
}
