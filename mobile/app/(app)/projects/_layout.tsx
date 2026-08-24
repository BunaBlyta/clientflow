import { Stack } from 'expo-router';
import { useTheme } from '../../../lib/theme';

export default function ProjectsStackLayout() {
  const { color } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: color.canvas },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="[id]/index"
        options={({ route }) => ({
          title: '',
          animation: hasTabSource(route.params) ? 'none' : 'slide_from_right',
        })}
      />
      <Stack.Screen
        name="[id]/notes"
        options={({ route }) => ({
          title: '',
          animation: hasTabSource(route.params) ? 'none' : 'slide_from_right',
        })}
      />
      <Stack.Screen name="[id]/invoices/index" options={{ title: '' }} />
      <Stack.Screen
        name="[id]/invoices/[invoiceId]/index"
        options={({ route }) => ({
          title: '',
          animation: hasTabSource(route.params) ? 'none' : 'slide_from_right',
        })}
      />
      <Stack.Screen
        name="[id]/invoices/[invoiceId]/checkout"
        options={{ presentation: 'modal' }}
      />
    </Stack>
  );
}

function hasTabSource(params: object | undefined) {
  if (!params || !('source' in params)) return false;
  return params.source === 'home' || params.source === 'invoices' || params.source === 'notifications';
}
