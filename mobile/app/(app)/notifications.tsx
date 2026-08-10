import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NotificationRow } from '../../components/NotificationRow';
import { Divider } from '../../components/ui/Divider';
import { EmptyState } from '../../components/ui/EmptyState';
import { Screen } from '../../components/ui/Screen';
import { color, fontFamily, fontSize, spacing } from '../../lib/theme';
import { useDataStore } from '../../store/data-store';
import type { Notification } from '../../lib/types';

export default function NotificationsScreen() {
  const router = useRouter();
  const notifications = useDataStore((s) =>
    [...s.notifications].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  );
  const markRead = useDataStore((s) => s.markNotificationRead);
  const markAllRead = useDataStore((s) => s.markAllNotificationsRead);
  const unread = useDataStore((s) => s.unreadNotificationCount());

  function handlePress(notification: Notification) {
    markRead(notification.id);
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
          <Pressable onPress={markAllRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </Pressable>
        )}
      </View>

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
});
