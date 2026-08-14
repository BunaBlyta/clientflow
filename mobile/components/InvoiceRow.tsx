import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatCurrency, formatDate, isPastDue } from '../lib/format';
import { getInvoiceKindLabel, getInvoiceStatusMeta, getOverdueMeta } from '../lib/status';
import { fontFamily, fontSize, spacing, useTheme } from '../lib/theme';
import { useI18n } from '../lib/i18n';
import type { Invoice } from '../lib/types';

interface InvoiceRowProps {
  invoice: Invoice;
  onPress: () => void;
  preview?: boolean;
}

export function InvoiceRow({ invoice, onPress, preview = false }: InvoiceRowProps) {
  const { color } = useTheme();
  const { t } = useI18n();
  const styles = createStyles(color);
  const overdue =
    (invoice.status === 'SENT' || invoice.status === 'FAILED') &&
    isPastDue(invoice.dueDate);
  const meta = overdue ? getOverdueMeta(color, t) : getInvoiceStatusMeta(invoice.status, color, t);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, preview && styles.previewRow, pressed && styles.pressed]}
    >
      <View style={styles.left}>
        <Text style={styles.label} numberOfLines={1}>
          {invoice.label}
        </Text>
        <Text style={styles.meta}>
          {getInvoiceKindLabel(invoice.kind, t)}
          {invoice.dueDate && invoice.status !== 'PAID'
            ? ` · ${t('invoices.due')} ${formatDate(invoice.dueDate)}`
            : ''}
          {invoice.paidAt ? ` · ${t('invoices.paid')} ${formatDate(invoice.paidAt)}` : ''}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.amount}>{formatCurrency(invoice.amountCents)}</Text>
        <Text style={[styles.statusText, { color: meta.text }]}>{meta.label}</Text>
      </View>
      <ChevronRight size={18} color={color.textMuted} style={{ marginLeft: spacing.sm }} />
    </Pressable>
  );
}

function createStyles(color: ReturnType<typeof useTheme>['color']) {
  return StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  previewRow: {
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.sm,
  },
  pressed: {
    opacity: 0.6,
  },
  left: {
    flex: 1,
    marginRight: spacing.md,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.body,
    color: color.textPrimary,
  },
  meta: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.meta,
    color: color.textMuted,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  amount: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.body,
    color: color.textPrimary,
  },
  statusText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.meta,
  },
  });
}
