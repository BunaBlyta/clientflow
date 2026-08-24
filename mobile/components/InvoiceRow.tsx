import { ChevronRight, Circle, FileText } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatCurrency, formatDate, isPastDue } from '../lib/format';
import { getInvoiceKindLabel, getInvoiceStatusMeta, getOverdueMeta } from '../lib/status';
import { fontFamily, fontSize, radius, spacing, useTheme } from '../lib/theme';
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
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
    >
      <View style={[styles.row, preview && styles.previewRow]}>
        <View style={styles.iconWrap}>
          <FileText size={16} color={color.accentText} strokeWidth={1.8} />
        </View>
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
          <View style={styles.statusRow}>
            <Circle size={6} color={meta.text} fill={meta.text} />
            <Text style={[styles.statusText, { color: meta.text }]}>{meta.label}</Text>
          </View>
        </View>
        <ChevronRight size={18} color={color.textMuted} style={{ marginLeft: spacing.sm }} />
      </View>
    </Pressable>
  );
}

function createStyles(color: ReturnType<typeof useTheme>['color']) {
  return StyleSheet.create({
  pressable: {
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    gap: spacing.md,
  },
  previewRow: {
    paddingVertical: spacing.md,
  },
  pressed: {
    opacity: 0.6,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: color.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  });
}
