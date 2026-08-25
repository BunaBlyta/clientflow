import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatCurrency, formatDate, isPastDue } from '../lib/format';
import { getInvoiceKindLabel, getInvoiceStatusMeta, getOverdueMeta } from '../lib/status';
import { fontFamily, fontSize, radius, spacing, useTheme, type ThemeColors } from '../lib/theme';
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
  const kindLabel = getInvoiceKindLabel(invoice.kind, t);
  // Rows only pick up a tinted wash when something needs attention — an
  // overdue balance or a payment still confirming. Everything else (sent,
  // paid, voided) stays flat so those two states actually stand out.
  const attention = overdue || invoice.status === 'PAYMENT_PENDING';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
    >
      <View
        style={[
          styles.row,
          preview && styles.previewRow,
          attention && { backgroundColor: meta.bg, borderColor: meta.border },
        ]}
      >
        <View style={styles.left}>
          <Text style={styles.label} numberOfLines={1}>
            {invoice.label}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>{kindLabel}</Text>
          <Text style={styles.amount} numberOfLines={1}>{formatCurrency(invoice.amountCents)}</Text>
          <Text style={styles.date} numberOfLines={1}>
            {invoice.paidAt ? `${t('invoices.paid')} ${formatDate(invoice.paidAt)}` : invoice.dueDate ? `${t('invoices.due')} ${formatDate(invoice.dueDate)}` : ''}
          </Text>
        </View>
        <View style={styles.right}>
          <View style={[styles.statusPill, { backgroundColor: meta.bg }]}>
            <Text style={[styles.statusText, { color: meta.text }]}>{meta.label}</Text>
          </View>
          <Text style={[styles.actionText, { color: invoice.status === 'PAID' ? color.textSecondary : color.accent }]}>
            {invoice.status === 'PAID' || invoice.status === 'VOIDED' || invoice.status === 'REFUNDED' ? t('common.viewAll') : t('invoices.payNow')}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function createStyles(color: ThemeColors) {
  return StyleSheet.create({
  pressable: {
    width: '100%',
  },
    row: {
      flexDirection: 'row',
      alignItems: 'stretch',
      minWidth: 0,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: color.border,
      backgroundColor: color.surfaceMuted,
      gap: spacing.md,
  },
  previewRow: {
    paddingVertical: spacing.md,
  },
  pressed: {
    opacity: 0.6,
  },
    accentBar: {
      width: 4,
      alignSelf: 'stretch',
      borderRadius: radius.pill,
    },
  left: {
    flex: 1,
    minWidth: 0,
    marginRight: spacing.md,
  },
  label: {
    fontFamily: fontFamily.medium,
      fontSize: fontSize.cardTitle,
      color: color.textPrimary,
      lineHeight: 20,
  },
  meta: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.meta,
    color: color.textMuted,
      marginTop: 2,
    },
    amount: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.heading,
      color: color.textPrimary,
      marginTop: spacing.lg,
    },
    date: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.caption,
      color: color.textMuted,
      marginTop: 2,
    },
    right: {
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      minWidth: 84,
    },
    statusPill: {
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    statusText: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.meta,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    actionText: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.cardTitle,
    },
  });
}
