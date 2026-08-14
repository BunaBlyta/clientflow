import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle2, FileText } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { Button } from '../../../../../../components/ui/Button';
import { EmptyState } from '../../../../../../components/ui/EmptyState';
import { Screen } from '../../../../../../components/ui/Screen';
import { formatCurrency, formatDate, isPastDue } from '../../../../../../lib/format';
import {
  getInvoiceKindLabel,
  getInvoiceStatusMeta,
  getOverdueMeta,
} from '../../../../../../lib/status';
import { fontFamily, fontSize, spacing, useTheme } from '../../../../../../lib/theme';
import { useI18n } from '../../../../../../lib/i18n';
import { useDataStore } from '../../../../../../store/data-store';
import { useAuthStore } from '../../../../../../store/auth-store';

export default function InvoiceDetailScreen() {
  const { id, invoiceId } = useLocalSearchParams<{ id: string; invoiceId: string }>();
  const router = useRouter();
  const { color } = useTheme();
  const { t } = useI18n();
  const styles = createStyles(color);
  const token = useAuthStore((s) => s.token);
  const invoice = useDataStore((s) => s.invoiceById(invoiceId));
  const refreshInvoice = useDataStore((s) => s.refreshInvoice);
  const [loading, setLoading] = useState(true);
  const [unreachable, setUnreachable] = useState(false);

  useEffect(() => {
    if (!token || !invoiceId) {
      setLoading(false);
      return;
    }
    let active = true;
    void refreshInvoice(invoiceId, token).then((ok) => {
      if (active) {
        setUnreachable(!ok);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [invoiceId, refreshInvoice, token]);

  if (loading && !invoice) {
    return (
      <Screen>
        <ActivityIndicator color={color.accent} />
      </Screen>
    );
  }

  if (!invoice) {
    return (
      <Screen>
        <EmptyState icon={FileText} title={t('invoices.invoiceNotFound')} />
      </Screen>
    );
  }

  const overdue =
    (invoice.status === 'SENT' || invoice.status === 'FAILED') &&
    isPastDue(invoice.dueDate);
  const meta = overdue ? getOverdueMeta(color, t) : getInvoiceStatusMeta(invoice.status, color, t);
  const payable = invoice.status === 'SENT' || invoice.status === 'FAILED';

  return (
    <Screen>
      <Text style={styles.screenTitle}>{invoice.label}</Text>
      <Text style={styles.kind}>{getInvoiceKindLabel(invoice.kind, t)}</Text>
      {unreachable && <Text style={styles.error}>{t('invoices.liveUnavailable')}</Text>}
      <Text style={styles.amount}>{formatCurrency(invoice.amountCents)}</Text>
      <Text style={[styles.statusText, { color: meta.text }]}>{meta.label}</Text>

      <View style={styles.detailsBlock}>
        <DetailRow styles={styles} label={t('invoices.description')} value={invoice.label} />
        <DetailRow styles={styles} label={t('invoices.issued')} value={formatDate(invoice.createdAt)} />
        {invoice.dueDate && (
          <DetailRow styles={styles} label={t('invoices.due')} value={formatDate(invoice.dueDate)} />
        )}
        {invoice.paidAt && (
          <DetailRow styles={styles} label={t('invoices.paid')} value={formatDate(invoice.paidAt)} />
        )}
      </View>

      {invoice.status === 'PAYMENT_PENDING' && (
        <View style={styles.processingBanner}>
          <Text style={styles.processingText}>
            {t('invoices.paymentProcessing')}
          </Text>
        </View>
      )}

      {invoice.status === 'PAID' && (
        <View style={styles.paidBanner}>
          <CheckCircle2 size={16} color={color.success} />
          <Text style={styles.paidText}>
            {t('invoices.paid')}{invoice.paidAt ? ` ${formatDate(invoice.paidAt)}` : ''}
          </Text>
        </View>
      )}

      {payable && (
        <Button
          label={invoice.status === 'FAILED' ? t('invoices.retryPayment') : t('invoices.payNow')}
          onPress={() =>
            router.push(`/projects/${id}/invoices/${invoiceId}/checkout`)
          }
        />
      )}
    </Screen>
  );
}

function DetailRow({ label, value, styles }: { label: string; value: string; styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function createStyles(color: ReturnType<typeof useTheme>['color']) {
  return StyleSheet.create({
  statusText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.caption,
    marginTop: spacing.xs,
  },
  screenTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.headingLg,
    color: color.textPrimary,
    marginBottom: spacing.xs,
  },
  kind: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.caption,
    color: color.textMuted,
    marginTop: spacing.sm,
  },
  amount: {
    fontFamily: fontFamily.semibold,
    fontSize: 32,
    color: color.textPrimary,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  detailsBlock: {
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.border,
  },
  rowLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.caption,
    color: color.textMuted,
  },
  rowValue: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.caption,
    color: color.textPrimary,
  },
  processingBanner: {
    backgroundColor: color.warningBg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.warningBorder,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  processingText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.caption,
    color: color.warning,
    lineHeight: 18,
  },
  paidBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: color.successBg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.successBorder,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  paidText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.caption,
    color: color.success,
  },
  error: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.meta,
    color: color.warning,
    marginTop: spacing.sm,
  },
  });
}
