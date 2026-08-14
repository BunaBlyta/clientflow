import { Tabs } from 'expo-router';
import { Bell, FolderKanban, User } from 'lucide-react-native';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { spacing, useTheme } from '../../lib/theme';
import { useI18n } from '../../lib/i18n';
import { useAuthStore } from '../../store/auth-store';
import { useDataStore } from '../../store/data-store';

const TAB_BAR_HEIGHT = 64;

export default function AppTabsLayout() {
  const { color } = useTheme();
  const { t } = useI18n();
  const token = useAuthStore((s) => s.token);
  const refreshNotifications = useDataStore((s) => s.refreshNotifications);

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
          height: TAB_BAR_HEIGHT,
          paddingBottom: 0,
          backgroundColor: color.neutralBg,
          borderTopColor: color.borderStrong,
          borderTopWidth: StyleSheet.hairlineWidth,
          shadowColor: color.shadow,
          shadowOpacity: 0.16,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -4 },
          elevation: 12,
        },
        tabBarItemStyle: {
          paddingTop: spacing.sm,
          paddingBottom: 0,
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
