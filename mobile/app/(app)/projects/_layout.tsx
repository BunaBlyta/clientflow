import { Stack } from 'expo-router';
import { fontFamily, fontSize, useTheme } from '../../../lib/theme';
import { useI18n } from '../../../lib/i18n';

export default function ProjectsStackLayout() {
  const { color } = useTheme();
  const { t } = useI18n();
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
      <Stack.Screen name="index" options={{ title: t('tabs.projects') }} />
      <Stack.Screen name="[id]/index" options={{ title: '' }} />
      <Stack.Screen name="[id]/notes" options={{ title: t('projects.notes') }} />
      <Stack.Screen name="[id]/invoices/index" options={{ title: t('projects.invoices') }} />
      <Stack.Screen name="[id]/invoices/[invoiceId]/index" options={{ title: t('invoices.invoice') }} />
      <Stack.Screen
        name="[id]/invoices/[invoiceId]/checkout"
        options={{ title: t('checkout.title'), presentation: 'modal' }}
      />
    </Stack>
  );
}
