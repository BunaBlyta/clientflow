import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
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
import { fontFamily, fontSize, radius, spacing, useTheme } from '../../../../../../lib/theme';
import { useI18n } from '../../../../../../lib/i18n';
import { useDataStore } from '../../../../../../store/data-store';
import { useAuthStore } from '../../../../../../store/auth-store';
import { AppBackButton } from '../../../../../../components/OriginBackButton';

export default function InvoiceDetailScreen() {
  const { id, invoiceId, source, tab } = useLocalSearchParams<{
    id: string;
    invoiceId: string;
    source?: string;
    tab?: string;
  }>();
  const router = useRouter();
  const navigation = useNavigation() as unknown as {
    navigate: (
      screen: '[invoiceId]/checkout',
      params: { invoiceId: string; id: string; tab: 'invoices' },
    ) => void;
  };
  const { color } = useTheme();
  const { language, t } = useI18n();
  const styles = createStyles(color);
  const token = useAuthStore((s) => s.token);
  const invoice = useDataStore((s) => s.invoiceById(invoiceId));
  const refreshInvoice = useDataStore((s) => s.refreshInvoice);
  const [loading, setLoading] = useState(true);
  const [unreachable, setUnreachable] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [paymentCheckMessage, setPaymentCheckMessage] = useState<string | null>(null);

  async function handleCheckPayment() {
    if (!token || !invoiceId) return;
    setCheckingPayment(true);
    setPaymentCheckMessage(null);
    try {
      const ok = await refreshInvoice(invoiceId, token, true);
      setUnreachable(!ok);
      if (!ok) {
        setPaymentCheckMessage(t('invoices.paymentCheckUnavailable'));
        return;
      }

      const latest = useDataStore.getState().invoiceById(invoiceId);
      if (latest?.status === 'PAYMENT_PENDING') {
        setPaymentCheckMessage(t('invoices.paymentStillProcessing'));
      }
    } finally {
      setCheckingPayment(false);
    }
  }

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
        <AppBackButton source={source} accessibilityLabel={t('common.backToInvoice')} />
        <ActivityIndicator color={color.accent} />
      </Screen>
    );
  }

  if (!invoice) {
    return (
      <Screen>
        <AppBackButton source={source} accessibilityLabel={t('common.backToInvoice')} />
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
      <AppBackButton source={source} accessibilityLabel={t('common.backToInvoice')} />
      <Text style={styles.screenTitle}>{invoice.label}</Text>
      <Text style={styles.kind}>{getInvoiceKindLabel(invoice.kind, t)}</Text>
      {unreachable && <Text style={styles.error}>{t('invoices.liveUnavailable')}</Text>}
      <Text style={styles.amount} numberOfLines={1} adjustsFontSizeToFit>
        {formatCurrency(invoice.amountCents, language)}
      </Text>
      <Text style={[styles.statusText, { color: meta.text }]}>{meta.label}</Text>

      <View style={styles.detailsBlock}>
        <DetailRow styles={styles} label={t('invoices.description')} value={invoice.label} />
        <DetailRow styles={styles} label={t('invoices.issued')} value={formatDate(invoice.createdAt, language)} />
        {invoice.dueDate && (
          <DetailRow styles={styles} label={t('invoices.due')} value={formatDate(invoice.dueDate, language)} />
        )}
        {invoice.paidAt && (
          <DetailRow styles={styles} label={t('invoices.paid')} value={formatDate(invoice.paidAt, language)} />
        )}
      </View>

      {invoice.status === 'PAYMENT_PENDING' && (
        <View style={styles.processingBanner}>
          <Text style={styles.processingText}>
            {t('invoices.paymentProcessing')}
          </Text>
          <View style={styles.processingAction}>
            <Button
              label={checkingPayment ? t('common.loading') : t('invoices.checkPayment')}
              onPress={() => void handleCheckPayment()}
              loading={checkingPayment}
              variant="secondary"
            />
          </View>
          {paymentCheckMessage && (
            <Text style={styles.paymentCheckMessage}>{paymentCheckMessage}</Text>
          )}
        </View>
      )}

      {invoice.status === 'PAID' && (
        <View style={styles.paidBanner}>
          <CheckCircle2 size={16} color={color.success} />
          <Text style={styles.paidText}>
            {t('invoices.paid')}{invoice.paidAt ? ` ${formatDate(invoice.paidAt, language)}` : ''}
          </Text>
        </View>
      )}

      {payable && (
        <Button
          label={invoice.status === 'FAILED' ? t('invoices.retryPayment') : t('invoices.payNow')}
          onPress={() => {
            if (tab === 'invoices') {
              navigation.navigate('[invoiceId]/checkout', {
                invoiceId,
                id,
                tab: 'invoices',
              });
              return;
            }
            if (tab === 'notifications') {
              router.push(
                `/notifications/projects/${id}/invoices/${invoiceId}/checkout?tab=notifications`,
              );
              return;
            }
            router.push(`/projects/${id}/invoices/${invoiceId}/checkout`);
          }}
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
    fontSize: fontSize.heading,
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
    fontFamily: fontFamily.bold,
    fontSize: fontSize.headingLg,
    color: color.textPrimary,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  detailsBlock: {
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    shadowOpacity: 0,
    elevation: 0,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
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
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  processingText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.caption,
    color: color.warning,
    lineHeight: 18,
  },
  processingAction: {
    marginTop: spacing.md,
  },
  paymentCheckMessage: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.meta,
    color: color.textMuted,
    lineHeight: 17,
    marginTop: spacing.sm,
  },
  paidBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: color.successBg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.successBorder,
    borderRadius: radius.lg,
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
