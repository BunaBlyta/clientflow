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
  const refreshNotifications = useDataStore((s) => s.refreshNotifications);
  const [unreachable, setUnreachable] = useState(false);
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

  function handlePress(notification: Notification) {
    if (notification.projectId && notification.invoiceId) {
      router.push(
        `/projects/${notification.projectId}/invoices/${notification.invoiceId}`
      );
    } else if (notification.projectId) {
      router.push(`/projects/${notification.projectId}`);
    }
  }

  return (
    <Screen scroll={notifications.length > 0}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Notifications</Text>
        {unread > 0 && (
          <Pressable disabled style={styles.markAllDisabled}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </Pressable>
        )}
      </View>
      {unreachable && (
        <Text style={styles.error}>
          Live notifications are unavailable. Showing saved notification data.
        </Text>
      )}
      {unread > 0 && (
        <Text style={styles.readNote}>
          Marking notifications read will be available shortly.
        </Text>
      )}

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="You're all caught up" />
      ) : (
        notifications.map((notification, index) => (
          <View key={notification.id}>
            <NotificationRow
              notification={notification}
              onPress={() => handlePress(notification)}
            />
            {index < notifications.length - 1 && <Divider />}
          </View>
        ))
      )}
    </Screen>
  );
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
  error: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.meta,
    color: color.warning,
    marginBottom: spacing.md,
  },
  readNote: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.meta,
    color: color.textMuted,
    marginBottom: spacing.md,
  },
});
