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

// Each notification type gets a real hue, not a uniform muted icon — the
// color is the fast-scan signal, the timeline dot and icon both carry it.
function typeColor(type: Notification['type'], color: ThemeColors) {
  switch (type) {
    case 'PAYMENT_SUCCEEDED':
    case 'REQUEST_APPROVED':
      return color.success;
    case 'PAYMENT_FAILED':
    case 'REQUEST_REJECTED':
      return color.danger;
    case 'PROJECT_STAGE_CHANGED':
      return color.violet;
    case 'INVOICE_ISSUED':
    case 'REQUEST_SUBMITTED':
    case 'EXTRA_CHARGE_CREATED':
      return color.warning;
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

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={[styles.rail, { backgroundColor: tint }]} />
      <View style={[styles.iconWrap, { backgroundColor: notification.read ? color.accentSoft : tint + '18' }]}>
        <Icon size={22} color={tint} strokeWidth={1.8} />
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
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surfaceMuted,
  },
  pressed: {
    opacity: 0.6,
  },
  rail: {
    width: 4,
    borderRadius: radius.pill,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
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
    fontSize: fontSize.cardTitle,
    color: color.textPrimary,
  },
  titleUnread: {
    fontFamily: fontFamily.semibold,
    color: color.textPrimary,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.body,
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
