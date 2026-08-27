import { useNavigation } from 'expo-router';
import { FileText } from 'lucide-react-native';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { InvoiceRow } from '../../../components/InvoiceRow';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Screen } from '../../../components/ui/Screen';
import { Card } from '../../../components/ui/Card';
import { formatCurrency } from '../../../lib/format';
import { fontFamily, fontSize, spacing, textShadow, useTheme } from '../../../lib/theme';
import { useI18n } from '../../../lib/i18n';
import { useAuthStore } from '../../../store/auth-store';
import { useDataStore } from '../../../store/data-store';
import { useShallow } from 'zustand/react/shallow';

export default function InvoicesScreen() {
  const navigation = useNavigation() as unknown as {
    navigate: (
      screen: '[invoiceId]',
      params: { invoiceId: string; id: string; tab: 'invoices' },
    ) => void;
  };
  const { color } = useTheme();
  const { language, t } = useI18n();
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
      <View style={styles.topbar}>
        <Text style={styles.title}>{t('tabs.invoices')}</Text>
      </View>
      {invoices.length === 0 && <Text style={styles.subtitle}>{t('invoices.emptySubtitle')}</Text>}
      {unreachable && <Text style={styles.error}>{t('invoices.unavailable')}</Text>}
      {loading && invoices.length === 0 ? (
        <ActivityIndicator color={color.accentText} style={styles.loading} />
      ) : invoices.length === 0 ? (
        <EmptyState icon={FileText} title={t('invoices.emptyTitle')} subtitle={t('invoices.emptySubtitle')} />
      ) : (
        <View>
          <View style={styles.summaryGrid}>
            <Card tone="muted" padding={12} style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>{t('projects.outstanding')}</Text>
              <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(outstandingTotal, language)}</Text>
              <Text style={styles.summaryHint}>{t('ui.invoicesDue', { count: invoices.filter((invoice) => invoice.status !== 'PAID').length })}</Text>
            </Card>
            <Card tone="muted" style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>{t('projects.paidToDate')}</Text>
              <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(paidTotal, language)}</Text>
              <Text style={styles.summaryHint}>{t('ui.invoicesPaid', { count: invoices.filter((invoice) => invoice.status === 'PAID').length })}</Text>
            </Card>
          </View>
          <View style={styles.listHeading}>
            <Text style={styles.listHeadingText}>{t('ui.allInvoices')}</Text>
          </View>
          <View style={styles.list}>
            {invoices.map((invoice) => (
              <InvoiceRow
                key={invoice.id}
                invoice={invoice}
                onPress={() =>
                  navigation.navigate('[invoiceId]', {
                    invoiceId: invoice.id,
                    id: invoice.projectId,
                    tab: 'invoices',
                  })
                }
              />
            ))}
          </View>
        </View>
      )}
    </Screen>
  );
}

function createStyles(color: ReturnType<typeof useTheme>['color']) {
  return StyleSheet.create({
    topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
    title: { fontFamily: fontFamily.serif, fontSize: fontSize.headingLg, color: color.textPrimary, ...textShadow },
    subtitle: { fontFamily: fontFamily.regular, fontSize: fontSize.caption, color: color.textMuted, marginTop: spacing.xs, marginBottom: spacing.xl, ...textShadow },
    error: { fontFamily: fontFamily.regular, fontSize: fontSize.meta, color: color.danger, marginBottom: spacing.md },
    loading: { marginTop: spacing.xxl },
    summaryGrid: { flexDirection: 'row', gap: spacing.md, marginTop: 0, marginBottom: spacing.xl },
    summaryCard: { flex: 1, minHeight: 96 },
    summaryValue: { fontFamily: fontFamily.serif, fontSize: fontSize.heading, color: color.textPrimary, marginTop: spacing.sm },
    summaryLabel: { fontFamily: fontFamily.semibold, fontSize: fontSize.caption, color: color.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
    summaryHint: { fontFamily: fontFamily.regular, fontSize: fontSize.caption, color: color.textMuted, marginTop: spacing.xs },
    listHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
    listHeadingText: { fontFamily: fontFamily.serif, fontSize: fontSize.sectionTitle, color: color.textPrimary },
    list: { gap: spacing.md },
  });
}
