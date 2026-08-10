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
import { color, fontFamily, fontSize, radius, spacing } from '../lib/theme';
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

interface NotificationRowProps {
  notification: Notification;
  onPress: () => void;
}

export function NotificationRow({ notification, onPress }: NotificationRowProps) {
  const Icon = ICONS[notification.type] ?? Bell;
  const isAlert =
    notification.type === 'PAYMENT_FAILED' ||
    notification.type === 'REQUEST_REJECTED';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {!notification.read && <View style={styles.unreadDot} />}
      <View
        style={[
          styles.iconWrap,
          isAlert ? styles.iconWrapAlert : styles.iconWrapNeutral,
        ]}
      >
        <Icon size={16} color={isAlert ? color.danger : color.accentPressed} />
      </View>
      <View style={styles.textCol}>
        <Text
          style={[styles.title, !notification.read && styles.titleUnread]}
          numberOfLines={2}
        >
          {notification.title}
        </Text>
        <Text style={styles.body} numberOfLines={2}>
          {notification.body}
        </Text>
        <Text style={styles.time}>{formatRelativeTime(notification.createdAt)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.6,
  },
  unreadDot: {
    position: 'absolute',
    left: -spacing.sm,
    top: spacing.lg,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: color.accent,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapNeutral: {
    backgroundColor: color.accentSoft,
  },
  iconWrapAlert: {
    backgroundColor: color.dangerBg,
  },
  textCol: {
    flex: 1,
  },
  title: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.caption,
    color: color.textSecondary,
  },
  titleUnread: {
    color: color.textPrimary,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.caption,
    color: color.textMuted,
    marginTop: 2,
  },
  time: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.meta,
    color: color.textMuted,
    marginTop: spacing.xs,
  },
});
