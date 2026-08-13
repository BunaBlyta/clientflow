import { Tabs } from 'expo-router';
import { Bell, FolderKanban, User } from 'lucide-react-native';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, useTheme } from '../../lib/theme';
import { useI18n } from '../../lib/i18n';
import { useAuthStore } from '../../store/auth-store';
import { useDataStore } from '../../store/data-store';

export default function AppTabsLayout() {
  const insets = useSafeAreaInsets();
  const { color } = useTheme();
  const { t } = useI18n();
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
          height: 64 + insets.bottom,
          borderTopColor: color.border,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
        tabBarItemStyle: {
          paddingVertical: spacing.sm,
        },
      }}
    >
      <Tabs.Screen
        name="projects"
        options={{
          title: t('tabs.projects'),
          tabBarIcon: ({ color: c, size }) => <FolderKanban color={c} size={size} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: t('tabs.notifications'),
          tabBarBadge: unread > 0 ? unread : undefined,
          tabBarIcon: ({ color: c, size }) => <Bell color={c} size={size} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: t('tabs.account'),
          tabBarIcon: ({ color: c, size }) => <User color={c} size={size} />,
        }}
      />
    </Tabs>
  );
}
