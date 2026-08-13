import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { NotificationRow } from '../../components/NotificationRow';
import { Divider } from '../../components/ui/Divider';
import { EmptyState } from '../../components/ui/EmptyState';
import { Screen } from '../../components/ui/Screen';
import { color, fontFamily, fontSize, spacing } from '../../lib/theme';
import { useAuthStore } from '../../store/auth-store';
import { useDataStore } from '../../store/data-store';
import type { Notification } from '../../lib/types';
import { useShallow } from 'zustand/react/shallow';

export default function NotificationsScreen() {
  const router = useRouter();
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

  useEffect(() => {
    if (!token) return;
    let active = true;
    void refreshNotifications(token).then((ok) => {
      if (active) setUnreachable(!ok);
    });
    return () => {
      active = false;
    };
  }, [refreshNotifications, token]);

  async function handlePress(notification: Notification) {
    if (markingId || markingAll) return;
    setActionError('');
    if (!notification.read && token) {
      setMarkingId(notification.id);
      const ok = await markNotificationRead(notification.id, token);
      setMarkingId(null);
      if (!ok) setActionError('Unable to mark this notification as read.');
    }
    const target = getNotificationTarget(notification);
    if (target) router.push(target);
  }

  async function handleMarkAll() {
    if (!token || markingAll || unread === 0) return;
    setActionError('');
    setMarkingAll(true);
    const ok = await markAllNotificationsRead(token);
    setMarkingAll(false);
    if (!ok) setActionError('Some notifications could not be marked as read.');
  }

  return (
    <Screen scroll={notifications.length > 0}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Notifications</Text>
        {unread > 0 && (
          <Pressable
            onPress={() => void handleMarkAll()}
            disabled={markingAll || markingId !== null}
            style={[styles.markAllButton, (markingAll || markingId !== null) && styles.markAllDisabled]}
          >
            <Text style={styles.markAllText}>{markingAll ? 'Marking…' : 'Mark all read'}</Text>
          </Pressable>
        )}
      </View>
      {unreachable && (
        <Text style={styles.error}>
          Live notifications are unavailable. Showing saved notification data.
        </Text>
      )}
      {actionError ? <Text style={styles.error}>{actionError}</Text> : null}

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="You're all caught up" />
      ) : (
        notifications.map((notification, index) => (
          <View key={notification.id}>
            <NotificationRow
              notification={notification}
              onPress={() => void handlePress(notification)}
            />
            {index < notifications.length - 1 && <Divider />}
          </View>
        ))
      )}
    </Screen>
  );
}

function getNotificationTarget(notification: Notification): string | null {
  if (notification.projectId && notification.invoiceId) {
    return `/projects/${notification.projectId}/invoices/${notification.invoiceId}`;
  }
  if (notification.projectId && (notification.requestId || !notification.invoiceId)) {
    return `/projects/${notification.projectId}`;
  }
  return null;
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  heading: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.headingLg,
    color: color.textPrimary,
  },
  markAllText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.caption,
    color: color.accent,
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
});
