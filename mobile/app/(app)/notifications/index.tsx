import { useFocusEffect, useNavigation } from 'expo-router';
import { Bell } from 'lucide-react-native';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useCallback, useState } from 'react';
import { NotificationRow } from '../../../components/NotificationRow';
import { EmptyState } from '../../../components/ui/EmptyState';
import { NotificationRowSkeleton, Skeleton } from '../../../components/ui/Skeleton';
import { Screen } from '../../../components/ui/Screen';
import { fontFamily, fontSize, radius, spacing, textShadow, useTheme } from '../../../lib/theme';
import { useI18n } from '../../../lib/i18n';
import { useAuthStore } from '../../../store/auth-store';
import { useDataStore } from '../../../store/data-store';
import type { Notification } from '../../../lib/types';
import { useShallow } from 'zustand/react/shallow';

export default function NotificationsScreen() {
  const navigation = useNavigation() as unknown as {
    navigate: (
      screen: 'projects/[id]/index' | 'projects/[id]/notes' | 'projects/[id]/invoices/[invoiceId]/index',
      params: { id: string; invoiceId?: string; tab: 'notifications' },
    ) => void;
  };
  const { color } = useTheme();
  const { t } = useI18n();
  const styles = createStyles(color);
  const token = useAuthStore((s) => s.token);
  const markNotificationRead = useDataStore((s) => s.markNotificationRead);
  const markAllNotificationsRead = useDataStore((s) => s.markAllNotificationsRead);
  const archiveNotification = useDataStore((s) => s.archiveNotification);
  const refreshNotifications = useDataStore((s) => s.refreshNotifications);
  const loadMoreNotifications = useDataStore((s) => s.loadMoreNotifications);
  const notificationsHasMore = useDataStore((s) => s.notificationsHasMore);
  const notificationsLoading = useDataStore((s) => s.notificationsLoading);
  const notificationsLoadingMore = useDataStore((s) => s.notificationsLoadingMore);
  const [unreachable, setUnreachable] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [actionError, setActionError] = useState('');
  const notifications = useDataStore(
    useShallow((s) =>
      [...s.notifications].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    )
  );
  const unread = useDataStore((s) => s.unreadNotificationCount());
  const visibleNotifications = notifications.filter((notification) =>
    showArchived ? notification.archived === true : notification.archived !== true,
  );
  const groups = groupByRecency(visibleNotifications, t);

  useFocusEffect(
    useCallback(() => {
      if (!token) return undefined;
      let active = true;
      void refreshNotifications(token, { reset: true }).then((ok) => {
        if (active) setUnreachable(!ok);
      });
      return () => {
        active = false;
      };
    }, [refreshNotifications, token]),
  );

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!token || notificationsLoading || notificationsLoadingMore || !notificationsHasMore) return;
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromEnd = contentSize.height - (contentOffset.y + layoutMeasurement.height);
    if (distanceFromEnd > spacing.xl * 2) return;

    void loadMoreNotifications(token).then((ok) => {
      if (!ok) setActionError(t('notifications.loadFailed'));
    });
  }, [loadMoreNotifications, notificationsHasMore, notificationsLoading, notificationsLoadingMore, t, token]);

  async function handlePress(notification: Notification) {
    if (markingId || markingAll || archivingId) return;
    setActionError('');
    if (!notification.read && token) {
      setMarkingId(notification.id);
      const ok = await markNotificationRead(notification.id, token);
      setMarkingId(null);
      if (!ok) setActionError(t('notifications.markFailed'));
    }
    if (notification.type === 'NEW_NOTE' && notification.projectId) {
      navigation.navigate('projects/[id]/notes', {
        id: notification.projectId,
        tab: 'notifications',
      });
    } else if (notification.projectId && notification.invoiceId) {
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
    if (!token || markingAll || archivingId || unread === 0) return;
    setActionError('');
    setMarkingAll(true);
    const ok = await markAllNotificationsRead(token);
    setMarkingAll(false);
    if (!ok) setActionError(t('notifications.markAllFailed'));
  }

  async function handleArchive(notification: Notification) {
    if (!token || markingAll || markingId || archivingId) return;
    setActionError('');
    setArchivingId(notification.id);
    const shouldArchive = notification.archived !== true;
    const ok = await archiveNotification(notification.id, shouldArchive, token);
    setArchivingId(null);
    if (!ok) {
      setActionError(
        shouldArchive ? t('notifications.archiveFailed') : t('notifications.unarchiveFailed'),
      );
    }
  }

  return (
    <Screen
      scroll={visibleNotifications.length > 0 || notificationsHasMore}
      onScroll={handleScroll}
      scrollEventThrottle={160}
    >
      <View style={styles.headerRow}>
        <Text style={styles.heading}>{t('notifications.title')}</Text>
      </View>
      <View style={styles.filterRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: !showArchived }}
          onPress={() => {
            setShowArchived(false);
            setActionError('');
          }}
          style={[styles.filterButton, !showArchived && styles.filterButtonSelected]}
        >
          <Text style={[styles.filterText, !showArchived && styles.filterTextSelected]}>
            {t('notifications.active')}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: showArchived }}
          onPress={() => {
            setShowArchived(true);
            setActionError('');
          }}
          style={[styles.filterButton, showArchived && styles.filterButtonSelected]}
        >
          <Text style={[styles.filterText, showArchived && styles.filterTextSelected]}>
            {t('notifications.archived')}
          </Text>
        </Pressable>
      </View>
      {unread > 0 && (
        <View style={styles.markAllRow}>
          <Pressable
            onPress={() => void handleMarkAll()}
            disabled={markingAll || markingId !== null || archivingId !== null}
            style={[styles.markAllButton, (markingAll || markingId !== null || archivingId !== null) && styles.markAllDisabled]}
          >
            <Text style={styles.markAllText}>{markingAll ? t('notifications.marking') : t('notifications.markAll')}</Text>
          </Pressable>
        </View>
      )}
      {unreachable && (
        <Text style={styles.error}>
          {t('notifications.unavailable')}
        </Text>
      )}
      {actionError ? <Text style={styles.error}>{actionError}</Text> : null}

      {notificationsLoading && visibleNotifications.length === 0 ? (
        <View style={styles.group}>
          <Skeleton width={64} height={11} style={{ marginBottom: spacing.sm }} />
          {Array.from({ length: 6 }).map((_, index) => (
            <NotificationRowSkeleton key={index} />
          ))}
        </View>
      ) : visibleNotifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={showArchived ? t('notifications.noArchived') : t('notifications.caughtUp')}
        />
      ) : (
        <>
          {groups.map((group) => (
            <View key={group.label} style={styles.group}>
              <Text style={styles.groupLabel}>{group.label}</Text>
              <View>
                {group.items.map((notification, index) => (
                  <NotificationRow
                    key={notification.id}
                    notification={notification}
                    onPress={() => void handlePress(notification)}
                    onArchive={() => void handleArchive(notification)}
                    isArchiving={archivingId === notification.id}
                    isLast={index === group.items.length - 1}
                  />
                ))}
              </View>
            </View>
          ))}
          {notificationsLoadingMore ? (
            <ActivityIndicator color={color.accent} style={styles.loadingMore} />
          ) : null}
        </>
      )}
      {visibleNotifications.length === 0 && notificationsLoadingMore ? (
        <ActivityIndicator color={color.accent} style={styles.loadingMore} />
      ) : null}
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
    marginBottom: spacing.lg,
  },
  heading: {
      ...textShadow,
    fontFamily: fontFamily.serif,
    fontSize: fontSize.headingLg,
    color: color.textPrimary,
  },
  markAllRow: { alignItems: 'flex-end', marginTop: -spacing.sm, marginBottom: spacing.md },
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
  filterRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  filterButton: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  filterButtonSelected: {
    backgroundColor: color.accentSoft,
  },
  filterText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.caption,
    color: color.textMuted,
  },
  filterTextSelected: {
    color: color.accentText,
  },
  error: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.meta,
    color: color.danger,
    marginBottom: spacing.md,
  },
  group: {
    marginBottom: spacing.xxl,
  },
  groupLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.meta,
    color: color.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: spacing.sm,
  },
  loadingMore: {
    marginVertical: spacing.md,
  },
  });
}
