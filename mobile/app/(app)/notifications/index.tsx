import { useFocusEffect, useNavigation } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useCallback, useState } from 'react';
import { NotificationRow } from '../../../components/NotificationRow';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Screen } from '../../../components/ui/Screen';
import { fontFamily, fontSize, spacing, textShadow, useTheme } from '../../../lib/theme';
import { useI18n } from '../../../lib/i18n';
import { useAuthStore } from '../../../store/auth-store';
import { useDataStore } from '../../../store/data-store';
import type { Notification } from '../../../lib/types';
import { useShallow } from 'zustand/react/shallow';

export default function NotificationsScreen() {
  const navigation = useNavigation() as unknown as {
    navigate: (
      screen: 'projects/[id]/index' | 'projects/[id]/invoices/[invoiceId]/index',
      params: { id: string; invoiceId?: string; tab: 'notifications' },
    ) => void;
  };
  const { color } = useTheme();
  const { t } = useI18n();
  const styles = createStyles(color);
  const token = useAuthStore((s) => s.token);
  const markNotificationRead = useDataStore((s) => s.markNotificationRead);
  const markAllNotificationsRead = useDataStore((s) => s.markAllNotificationsRead);
  const refreshNotifications = useDataStore((s) => s.refreshNotifications);
  const [unreachable, setUnreachable] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [actionError, setActionError] = useState('');
  const notifications = useDataStore(
    useShallow((s) =>
      [...s.notifications].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    )
  );
  const unread = useDataStore((s) => s.unreadNotificationCount());
  const groups = groupByRecency(notifications, t);

  useFocusEffect(
    useCallback(() => {
      if (!token) return undefined;
      let active = true;
      void refreshNotifications(token).then((ok) => {
        if (active) setUnreachable(!ok);
      });
      return () => {
        active = false;
      };
    }, [refreshNotifications, token]),
  );

  async function handlePress(notification: Notification) {
    if (markingId || markingAll) return;
    setActionError('');
    if (!notification.read && token) {
      setMarkingId(notification.id);
      const ok = await markNotificationRead(notification.id, token);
      setMarkingId(null);
      if (!ok) setActionError(t('notifications.markFailed'));
    }
    if (notification.projectId && notification.invoiceId) {
      navigation.navigate('projects/[id]/invoices/[invoiceId]/index', {
        id: notification.projectId,
        invoiceId: notification.invoiceId,
        tab: 'notifications',
      });
    } else if (notification.projectId) {
      navigation.navigate('projects/[id]/index', {
        id: notification.projectId,
        tab: 'notifications',
      });
    }
  }

  async function handleMarkAll() {
    if (!token || markingAll || unread === 0) return;
    setActionError('');
    setMarkingAll(true);
    const ok = await markAllNotificationsRead(token);
    setMarkingAll(false);
    if (!ok) setActionError(t('notifications.markAllFailed'));
  }

  return (
    <Screen scroll={notifications.length > 0}>
      <View style={styles.headerRow}>
        <View style={styles.headingCopy}>
          <Text style={styles.heading}>{t('notifications.title')}</Text>
        </View>
        {unread > 0 && (
          <Pressable
            onPress={() => void handleMarkAll()}
            disabled={markingAll || markingId !== null}
            style={[styles.markAllButton, (markingAll || markingId !== null) && styles.markAllDisabled]}
          >
            <Text style={styles.markAllText}>{markingAll ? t('notifications.marking') : t('notifications.markAll')}</Text>
          </Pressable>
        )}
      </View>
      {unreachable && (
        <Text style={styles.error}>
          {t('notifications.unavailable')}
        </Text>
      )}
      {actionError ? <Text style={styles.error}>{actionError}</Text> : null}

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title={t('notifications.caughtUp')} />
      ) : (
        groups.map((group) => (
          <View key={group.label} style={styles.group}>
            <Text style={styles.groupLabel}>{group.label}</Text>
            <View>
              {group.items.map((notification, index) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  onPress={() => void handlePress(notification)}
                  isLast={index === group.items.length - 1}
                />
              ))}
            </View>
          </View>
        ))
      )}
    </Screen>
  );
}

function groupByRecency(notifications: Notification[], t: (key: 'notifications.today' | 'notifications.yesterday' | 'notifications.earlier') => string) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;

  const today: Notification[] = [];
  const yesterday: Notification[] = [];
  const earlier: Notification[] = [];

  for (const notification of notifications) {
    const createdAt = new Date(notification.createdAt).getTime();
    if (createdAt >= startOfToday) today.push(notification);
    else if (createdAt >= startOfYesterday) yesterday.push(notification);
    else earlier.push(notification);
  }

  return [
    { label: t('notifications.today'), items: today },
    { label: t('notifications.yesterday'), items: yesterday },
    { label: t('notifications.earlier'), items: earlier },
  ].filter((group) => group.items.length > 0);
}

function createStyles(color: ReturnType<typeof useTheme>['color']) {
  return StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  heading: {
      ...textShadow,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.headingLg,
    color: color.textPrimary,
  },
  headingCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: 2,
  },
  headingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: color.surfaceMuted,
  },
  headingDotUnread: {
    backgroundColor: color.accent,
  },
  headingMetaText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.meta,
    color: color.textMuted,
  },
  markAllText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.caption,
    color: color.accentText,
  },
  markAllDisabled: {
    opacity: 0.45,
  },
  markAllButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  error: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.meta,
    color: color.warning,
    marginBottom: spacing.md,
  },
  group: {
    marginBottom: spacing.xxl,
  },
  groupLabel: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sectionTitle,
    color: color.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: spacing.lg,
  },
  });
}
