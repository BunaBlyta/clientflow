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
import { fontFamily, fontSize, radius, spacing, useTheme } from '../lib/theme';
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
  const { color } = useTheme();
  const styles = createStyles(color);
  const Icon = ICONS[notification.type] ?? Bell;
  const isAlert =
    notification.type === 'PAYMENT_FAILED' ||
    notification.type === 'REQUEST_REJECTED';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
    >
      <View style={styles.row}>
        <View style={[styles.iconWrap, !notification.read && styles.iconWrapUnread]}>
          <Icon size={17} color={isAlert ? color.danger : color.textMuted} strokeWidth={1.7} />
          {!notification.read && <View style={[styles.unreadDot, { backgroundColor: color.accentPressed }]} />}
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
          <Text style={styles.body} numberOfLines={2}>
            {notification.body}
          </Text>
        </View>
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
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    gap: spacing.md,
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
    position: 'relative',
  },
  iconWrapUnread: {
    backgroundColor: color.accentSoft,
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: 0,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
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
    lineHeight: 18,
  },
  time: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.meta,
    color: color.textMuted,
    marginLeft: 'auto',
  },
  });
}
