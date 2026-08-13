import { Tabs } from 'expo-router';
import { Bell, FolderKanban, User } from 'lucide-react-native';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { color } from '../../lib/theme';
import { useAuthStore } from '../../store/auth-store';
import { useDataStore } from '../../store/data-store';

export default function AppTabsLayout() {
  const token = useAuthStore((s) => s.token);
  const refreshNotifications = useDataStore((s) => s.refreshNotifications);
  const unread = useDataStore((s) => s.unreadNotificationCount());

  useEffect(() => {
    if (token) void refreshNotifications(token);
  }, [refreshNotifications, token]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.accent,
        tabBarInactiveTintColor: color.textMuted,
        tabBarStyle: {
          borderTopColor: color.border,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
      }}
    >
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Projects',
          tabBarIcon: ({ color: c, size }) => <FolderKanban color={c} size={size} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarBadge: unread > 0 ? unread : undefined,
          tabBarIcon: ({ color: c, size }) => <Bell color={c} size={size} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color: c, size }) => <User color={c} size={size} />,
        }}
      />
    </Tabs>
  );
}
