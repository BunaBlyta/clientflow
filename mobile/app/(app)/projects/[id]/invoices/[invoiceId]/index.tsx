import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle2, FileText } from 'lucide-react-native';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { Button } from '../../../../../../components/ui/Button';
import { EmptyState } from '../../../../../../components/ui/EmptyState';
import { Screen } from '../../../../../../components/ui/Screen';
import { StatusPill } from '../../../../../../components/ui/StatusPill';
import { formatCurrency, formatDate, isPastDue } from '../../../../../../lib/format';
import {
  INVOICE_KIND_LABEL,
  INVOICE_STATUS_META,
  OVERDUE_META,
} from '../../../../../../lib/status';
import { color, fontFamily, fontSize, spacing } from '../../../../../../lib/theme';
import { useDataStore } from '../../../../../../store/data-store';
import { useAuthStore } from '../../../../../../store/auth-store';

export default function InvoiceDetailScreen() {
  const { id, invoiceId } = useLocalSearchParams<{ id: string; invoiceId: string }>();
  const router = useRouter();
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
    return <Screen><ActivityIndicator color={color.accent} /></Screen>;
  }

  if (!invoice) {
    return (
      <Screen>
        <EmptyState icon={FileText} title="Invoice not found" />
      </Screen>
    );
  }

  const overdue =
    (invoice.status === 'SENT' || invoice.status === 'FAILED') &&
    isPastDue(invoice.dueDate);
  const meta = overdue ? OVERDUE_META : INVOICE_STATUS_META[invoice.status];
  const payable = invoice.status === 'SENT' || invoice.status === 'FAILED';

  return (
    <Screen>
      <Stack.Screen options={{ title: invoice.label }} />

      <Text style={styles.kind}>{INVOICE_KIND_LABEL[invoice.kind]}</Text>
      {unreachable && <Text style={styles.error}>Live invoice data is unavailable. Showing saved data.</Text>}
      <Text style={styles.amount}>{formatCurrency(invoice.amountCents)}</Text>
      <StatusPill label={meta.label} text={meta.text} bg={meta.bg} border={meta.border} />

      <View style={styles.detailsBlock}>
        <DetailRow label="Invoice" value={invoice.label} />
        <DetailRow label="Created" value={formatDate(invoice.createdAt)} />
        {invoice.dueDate && (
          <DetailRow label="Due" value={formatDate(invoice.dueDate)} />
        )}
        {invoice.paidAt && (
          <DetailRow label="Paid" value={formatDate(invoice.paidAt)} />
        )}
      </View>

      {invoice.status === 'PAYMENT_PENDING' && (
        <View style={styles.processingBanner}>
          <Text style={styles.processingText}>
            We're confirming your payment with Stripe. This can take a moment —
            check back shortly.
          </Text>
        </View>
      )}

      {invoice.status === 'PAID' && (
        <View style={styles.paidBanner}>
          <CheckCircle2 size={16} color={color.success} />
          <Text style={styles.paidText}>
            Paid{invoice.paidAt ? ` on ${formatDate(invoice.paidAt)}` : ''}
          </Text>
        </View>
      )}

      {payable && (
        <Button
          label={invoice.status === 'FAILED' ? 'Retry payment' : 'Pay now'}
          onPress={() =>
            router.push(`/projects/${id}/invoices/${invoiceId}/checkout`)
          }
        />
      )}
    </Screen>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
    borderWidth: 1,
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
    borderWidth: 1,
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
