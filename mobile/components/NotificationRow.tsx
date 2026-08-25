import {
  Bell,
  CreditCard,
  FileText,
  MessageSquare,
  Milestone,
  ShieldCheck,
  ShieldX,
  XCircle,
} from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatRelativeTime } from '../lib/format';
import { fontFamily, fontSize, radius, spacing, useTheme, type ThemeColors } from '../lib/theme';
import type { Notification } from '../lib/types';

const ICONS: Record<Notification['type'], typeof Bell> = {
  REQUEST_SUBMITTED: FileText,
  REQUEST_APPROVED: ShieldCheck,
  REQUEST_REJECTED: ShieldX,
  INVOICE_ISSUED: FileText,
  PAYMENT_SUCCEEDED: CreditCard,
  PAYMENT_FAILED: XCircle,
  PROJECT_STAGE_CHANGED: Milestone,
  NEW_NOTE: MessageSquare,
  EXTRA_CHARGE_CREATED: FileText,
};

// Grey is the resting state. Colour is reserved for outcomes that deserve
// an immediate scan: successful or failed/payment-related activity.
function typeColor(type: Notification['type'], color: ThemeColors) {
  switch (type) {
    case 'PAYMENT_SUCCEEDED':
    case 'REQUEST_APPROVED':
      return color.success;
    case 'PAYMENT_FAILED':
    case 'REQUEST_REJECTED':
      return color.danger;
    case 'PROJECT_STAGE_CHANGED':
      return color.textSecondary;
    case 'INVOICE_ISSUED':
    case 'REQUEST_SUBMITTED':
    case 'EXTRA_CHARGE_CREATED':
      return color.textSecondary;
    case 'NEW_NOTE':
    default:
      return color.accent;
  }
}

interface NotificationRowProps {
  notification: Notification;
  onPress: () => void;
  isLast?: boolean;
}

export function NotificationRow({ notification, onPress, isLast = false }: NotificationRowProps) {
  const { color } = useTheme();
  const styles = createStyles(color);
  const Icon = ICONS[notification.type] ?? Bell;
  const tint = typeColor(notification.type, color);
  const isDanger = notification.type === 'PAYMENT_FAILED' || notification.type === 'REQUEST_REJECTED';
  const isSuccess = notification.type === 'PAYMENT_SUCCEEDED' || notification.type === 'REQUEST_APPROVED';
  const iconBackground = isDanger ? color.dangerBg : isSuccess ? color.successBg : color.surfaceMuted;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={[styles.rail, { backgroundColor: tint }]} />
      <View style={[styles.iconWrap, { backgroundColor: iconBackground }]}>
        <Icon size={16} color={tint} strokeWidth={1.8} />
      </View>
      <View style={styles.textCol}>
        <View style={styles.titleRow}>
          <Text
            style={[styles.title, !notification.read && styles.titleUnread]}
            numberOfLines={2}
          >
            {notification.title}
          </Text>
          <Text style={styles.time}>{formatRelativeTime(notification.createdAt)}</Text>
        </View>
        {notification.body ? <Text style={styles.body} numberOfLines={2}>{notification.body}</Text> : null}
      </View>
    </Pressable>
  );
}

function createStyles(color: ReturnType<typeof useTheme>['color']) {
  return StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: spacing.md,
    paddingRight: spacing.md,
    paddingLeft: spacing.sm,
    marginBottom: spacing.sm,
    gap: spacing.md,
    borderRadius: radius.md,
    backgroundColor: color.surfaceSage,
  },
  pressed: {
    opacity: 0.6,
  },
  rail: {
    width: 3,
    borderRadius: radius.pill,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.body,
    color: color.textPrimary,
  },
  titleUnread: {
    fontFamily: fontFamily.semibold,
    color: color.textPrimary,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 12.5,
    color: color.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  time: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.meta,
    color: color.textMuted,
    marginLeft: 'auto',
  },
  });
}
