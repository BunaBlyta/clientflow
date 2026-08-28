import {
  ArchiveRestore,
  Bell,
  CreditCard,
  FileText,
  LibraryBig,
  MessageSquare,
  Milestone,
  ShieldCheck,
  ShieldX,
  XCircle,
} from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuthStore } from '../store/auth-store';
import { useTranslatedUserContent } from '../lib/content-translation';
import { formatRelativeTime } from '../lib/format';
import { useI18n } from '../lib/i18n';
import {
  getLocalizedNotificationText,
  getUserAuthoredInvoiceDescription,
  getUserAuthoredNotificationBody,
} from '../lib/notification-text';
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

// Accent is the resting state. Semantic colour is reserved for outcomes
// that deserve an immediate scan: successful or failed/payment-related
// activity.
function typeColor(type: Notification['type'], color: ThemeColors) {
  switch (type) {
    case 'PAYMENT_SUCCEEDED':
    case 'REQUEST_APPROVED':
      return color.success;
    case 'PAYMENT_FAILED':
    case 'REQUEST_REJECTED':
      return color.danger;
    default:
      return color.accent;
  }
}

interface NotificationRowProps {
  notification: Notification;
  onPress: () => void;
  onArchive?: () => void;
  isArchiving?: boolean;
  isLast?: boolean;
}

export function NotificationRow({
  notification,
  onPress,
  onArchive,
  isArchiving = false,
  isLast = false,
}: NotificationRowProps) {
  const { color } = useTheme();
  const { language, t } = useI18n();
  const token = useAuthStore((state) => state.token);
  const styles = createStyles(color);
  const Icon = ICONS[notification.type] ?? Bell;
  const tint = typeColor(notification.type, color);
  const isDanger = notification.type === 'PAYMENT_FAILED' || notification.type === 'REQUEST_REJECTED';
  const isSuccess = notification.type === 'PAYMENT_SUCCEEDED' || notification.type === 'REQUEST_APPROVED';
  const iconBackground = isDanger ? color.dangerBg : isSuccess ? color.successBg : color.accentSoft;
  const localized = getLocalizedNotificationText(notification, t);
  const authoredBody = getUserAuthoredNotificationBody(notification);
  const invoiceDescription = getUserAuthoredInvoiceDescription(notification);
  const contentToTranslate = authoredBody ?? invoiceDescription;
  const translatedContent = useTranslatedUserContent(
    contentToTranslate ?? '',
    language,
    token,
    contentToTranslate !== null,
  );
  const displayedBody = authoredBody !== null
    ? translatedContent
    : invoiceDescription !== null
      ? getLocalizedNotificationText(notification, t, { invoiceDescription: translatedContent }).body
      : localized.body;
  const ArchiveIcon = notification.archived ? ArchiveRestore : LibraryBig;

  return (
    <View style={[styles.row, isLast && styles.lastRow]}>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.rowContent, pressed && styles.pressed]}>
        <View style={[styles.iconWrap, { backgroundColor: iconBackground }]}>
          <Icon size={16} color={tint} strokeWidth={1.8} />
        </View>
        <View style={styles.textCol}>
          <View style={styles.titleRow}>
            {!notification.read && <View style={styles.unreadDot} />}
            <Text
              style={[styles.title, !notification.read && styles.titleUnread]}
              numberOfLines={2}
            >
              {localized.title}
              <Text style={styles.time}> · {formatRelativeTime(notification.createdAt, language)}</Text>
            </Text>
          </View>
          {displayedBody ? <Text style={styles.body} numberOfLines={2}>{displayedBody}</Text> : null}
        </View>
      </Pressable>
      {onArchive ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={notification.archived ? t('notifications.unarchive') : t('notifications.archive')}
          accessibilityState={{ disabled: isArchiving }}
          disabled={isArchiving}
          hitSlop={8}
          onPress={(event) => {
            event.stopPropagation();
            onArchive();
          }}
          style={({ pressed }) => [styles.archiveButton, pressed && styles.archivePressed]}
        >
          {isArchiving ? (
            <ActivityIndicator size="small" color={color.textMuted} />
          ) : (
            <ArchiveIcon size={17} color={color.textMuted} strokeWidth={1.7} />
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

function createStyles(color: ReturnType<typeof useTheme>['color']) {
  return StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
    borderRadius: radius.md,
    backgroundColor: color.surfaceMuted,
  },
  rowContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.md,
    minWidth: 0,
  },
  lastRow: {
    marginBottom: 0,
  },
  pressed: {
    opacity: 0.6,
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
    alignItems: 'center',
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: color.accent,
    marginRight: spacing.xs,
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
  },
  archiveButton: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
    height: 32,
    width: 28,
  },
  archivePressed: {
    opacity: 0.55,
  },
  });
}
