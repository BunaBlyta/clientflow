import { useRouter } from 'expo-router';
import { FileText } from 'lucide-react-native';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { InvoiceRow } from '../../components/InvoiceRow';
import { Divider } from '../../components/ui/Divider';
import { EmptyState } from '../../components/ui/EmptyState';
import { Screen } from '../../components/ui/Screen';
import { fontFamily, fontSize, spacing, useTheme } from '../../lib/theme';
import { useI18n } from '../../lib/i18n';
import { useAuthStore } from '../../store/auth-store';
import { useDataStore } from '../../store/data-store';
import { useShallow } from 'zustand/react/shallow';

export default function InvoicesScreen() {
  const router = useRouter();
  const { color } = useTheme();
  const { t } = useI18n();
  const styles = createStyles(color);
  const token = useAuthStore((s) => s.token);
  const refreshInvoices = useDataStore((s) => s.refreshInvoices);
  const [loading, setLoading] = useState(true);
  const [unreachable, setUnreachable] = useState(false);
  const invoices = useDataStore(useShallow((s) => s.invoices.filter((invoice) => invoice.status !== 'DRAFT')));

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    let active = true;
    void refreshInvoices(token).then((ok) => {
      if (active) { setUnreachable(!ok); setLoading(false); }
    });
    return () => { active = false; };
  }, [refreshInvoices, token]);

  return (
    <Screen>
      <Text style={styles.eyebrow}>CLIENTFLOW</Text>
      <Text style={styles.title}>{t('tabs.invoices')}</Text>
      <Text style={styles.subtitle}>{t('invoices.emptySubtitle')}</Text>
      {unreachable && <Text style={styles.error}>{t('invoices.unavailable')}</Text>}
      {loading && invoices.length === 0 ? (
        <ActivityIndicator color={color.accentText} style={styles.loading} />
      ) : invoices.length === 0 ? (
        <EmptyState icon={FileText} title={t('invoices.emptyTitle')} subtitle={t('invoices.emptySubtitle')} />
      ) : (
        <View style={styles.listGroup}>
          {invoices.map((invoice, index) => (
            <View key={invoice.id}>
              <InvoiceRow invoice={invoice} onPress={() => router.push(`/projects/${invoice.projectId}/invoices/${invoice.id}`)} />
              {index < invoices.length - 1 && <Divider />}
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

function createStyles(color: ReturnType<typeof useTheme>['color']) {
  return StyleSheet.create({
    eyebrow: { fontFamily: fontFamily.medium, fontSize: fontSize.meta, letterSpacing: 1.6, color: color.accentText, marginTop: spacing.sm },
    title: { fontFamily: fontFamily.semibold, fontSize: fontSize.headingLg, color: color.textPrimary, marginTop: spacing.sm },
    subtitle: { fontFamily: fontFamily.regular, fontSize: fontSize.caption, color: color.textMuted, marginTop: spacing.xs, marginBottom: spacing.xl },
    error: { fontFamily: fontFamily.regular, fontSize: fontSize.meta, color: color.warning, marginBottom: spacing.md },
    loading: { marginTop: spacing.xxl },
    listGroup: { backgroundColor: color.surface, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: color.border, paddingHorizontal: spacing.md },
  });
}
