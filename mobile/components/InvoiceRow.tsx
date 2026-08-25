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
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
    >
      <View
        style={[
          styles.row,
          preview && styles.previewRow,
        ]}
      >
        <View style={[styles.rail, { backgroundColor: meta.text }]} />
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
          <Text style={[styles.statusText, { color: meta.text }]}>{meta.label}</Text>
          <View style={[styles.actionButton, invoice.status === 'PAID' || invoice.status === 'VOIDED' || invoice.status === 'REFUNDED' ? styles.actionButtonSecondary : styles.actionButtonPrimary]}>
            <Text style={[styles.actionText, { color: invoice.status === 'PAID' || invoice.status === 'VOIDED' || invoice.status === 'REFUNDED' ? color.textSecondary : color.textOnAccent }]}>
              {invoice.status === 'PAID' || invoice.status === 'VOIDED' || invoice.status === 'REFUNDED' ? t('common.viewAll') : t('invoices.payNow')}
            </Text>
          </View>
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
      paddingRight: spacing.lg,
      paddingLeft: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: color.surfaceSage,
      gap: spacing.md,
  },
  previewRow: {
    paddingVertical: spacing.md,
  },
  pressed: {
    opacity: 0.6,
  },
    rail: {
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
      fontFamily: fontFamily.serif,
      fontSize: fontSize.heading + 1,
      color: color.textPrimary,
      marginTop: spacing.md,
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
    actionButton: { minWidth: 92, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
    actionButtonPrimary: { backgroundColor: color.accent },
    actionButtonSecondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: color.border },
  });
}
