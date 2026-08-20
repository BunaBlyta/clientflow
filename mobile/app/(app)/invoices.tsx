import { useRouter } from 'expo-router';
import { FileText } from 'lucide-react-native';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { InvoiceRow } from '../../components/InvoiceRow';
import { Divider } from '../../components/ui/Divider';
import { EmptyState } from '../../components/ui/EmptyState';
import { Screen } from '../../components/ui/Screen';
import { formatCurrency } from '../../lib/format';
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
  const paidTotal = invoices
    .filter((invoice) => invoice.status === 'PAID')
    .reduce((sum, invoice) => sum + invoice.amountCents, 0);
  const outstandingTotal = invoices
    .filter((invoice) => invoice.status === 'SENT' || invoice.status === 'FAILED' || invoice.status === 'PAYMENT_PENDING')
    .reduce((sum, invoice) => sum + invoice.amountCents, 0);

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
      <Text style={styles.title}>{t('tabs.invoices')}</Text>
      {invoices.length === 0 && <Text style={styles.subtitle}>{t('invoices.emptySubtitle')}</Text>}
      {unreachable && <Text style={styles.error}>{t('invoices.unavailable')}</Text>}
      {loading && invoices.length === 0 ? (
        <ActivityIndicator color={color.accentText} style={styles.loading} />
      ) : invoices.length === 0 ? (
        <EmptyState icon={FileText} title={t('invoices.emptyTitle')} subtitle={t('invoices.emptySubtitle')} />
      ) : (
        <View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{formatCurrency(outstandingTotal)}</Text>
              <Text style={styles.summaryLabel}>{t('projects.outstanding')}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{formatCurrency(paidTotal)}</Text>
              <Text style={styles.summaryLabel}>{t('projects.paidToDate')}</Text>
            </View>
          </View>
          <View style={styles.listGroup}>
            {invoices.map((invoice, index) => (
              <View key={invoice.id}>
                <InvoiceRow invoice={invoice} onPress={() => router.push(`/projects/${invoice.projectId}/invoices/${invoice.id}`)} />
                {index < invoices.length - 1 && <Divider />}
              </View>
            ))}
          </View>
        </View>
      )}
    </Screen>
  );
}

function createStyles(color: ReturnType<typeof useTheme>['color']) {
  return StyleSheet.create({
    title: { fontFamily: fontFamily.semibold, fontSize: fontSize.headingLg, color: color.textPrimary },
    subtitle: { fontFamily: fontFamily.regular, fontSize: fontSize.caption, color: color.textMuted, marginTop: spacing.xs, marginBottom: spacing.xl },
    error: { fontFamily: fontFamily.regular, fontSize: fontSize.meta, color: color.warning, marginBottom: spacing.md },
    loading: { marginTop: spacing.xxl },
    summaryRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.xl, paddingVertical: spacing.lg, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: color.border },
    summaryItem: { flex: 1 },
    summaryDivider: { width: StyleSheet.hairlineWidth, height: 32, backgroundColor: color.border },
    summaryValue: { fontFamily: fontFamily.semibold, fontSize: fontSize.sectionTitle, color: color.textPrimary },
    summaryLabel: { fontFamily: fontFamily.regular, fontSize: fontSize.meta, color: color.textMuted, marginTop: spacing.xs },
    listGroup: { backgroundColor: color.surface, borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, borderColor: color.border, paddingHorizontal: spacing.md, overflow: 'hidden' },
  });
}
