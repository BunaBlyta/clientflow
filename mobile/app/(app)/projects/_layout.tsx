import { Stack } from 'expo-router';
import { color, fontFamily, fontSize } from '../../../lib/theme';

export default function ProjectsStackLayout() {
  return (
    <Stack
      screenOptions={{
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
      <Stack.Screen name="index" options={{ title: 'Projects' }} />
      <Stack.Screen name="[id]/index" options={{ title: '' }} />
      <Stack.Screen name="[id]/notes" options={{ title: 'Notes' }} />
      <Stack.Screen name="[id]/invoices/index" options={{ title: 'Invoices' }} />
      <Stack.Screen name="[id]/invoices/[invoiceId]/index" options={{ title: 'Invoice' }} />
      <Stack.Screen
        name="[id]/invoices/[invoiceId]/checkout"
        options={{ title: 'Checkout', presentation: 'modal' }}
      />
    </Stack>
  );
}
