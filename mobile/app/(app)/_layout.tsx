import { Tabs } from 'expo-router';
import { Bell, FileText, FolderKanban, House, UserRound } from 'lucide-react-native';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontFamily, radius, spacing, useTheme } from '../../lib/theme';
import { useI18n } from '../../lib/i18n';
import { useAuthStore } from '../../store/auth-store';
import { useDataStore } from '../../store/data-store';

const TAB_BAR_HEIGHT = 62;

export default function AppTabsLayout() {
  const { color } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
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
        animation: 'shift',
        transitionSpec: {
          animation: 'timing',
          config: { duration: 180 },
        },
        tabBarActiveTintColor: color.accentText,
        tabBarInactiveTintColor: color.textMuted,
        tabBarStyle: {
          height: TAB_BAR_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: spacing.xs,
          backgroundColor: color.surfaceMuted,
          borderTopWidth: 0,
          shadowOpacity: 0,
          elevation: 0,
        },
        tabBarItemStyle: {
          paddingTop: 0,
          paddingBottom: spacing.xs,
        },
        tabBarLabelStyle: {
          fontFamily: fontFamily.medium,
          fontSize: 11,
          marginTop: spacing.xs,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ focused }) => <TabIcon icon={House} focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: t('tabs.projects'),
          tabBarIcon: ({ focused }) => <TabIcon icon={FolderKanban} focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="invoices"
        options={{
          title: t('tabs.invoices'),
          tabBarIcon: ({ focused }) => <TabIcon icon={FileText} focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: t('tabs.notifications'),
          tabBarIcon: ({ focused }) => (
            <View>
              <TabIcon icon={Bell} focused={focused} color={color} />
              {unread > 0 && <View style={[styles.unreadDot, { backgroundColor: color.danger }]} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: t('tabs.account'),
          tabBarIcon: ({ focused }) => <TabIcon icon={UserRound} focused={focused} color={color} />,
        }}
      />
    </Tabs>
  );
}

function TabIcon({
  icon: Icon,
  focused,
  color,
}: {
  icon: typeof House;
  focused: boolean;
  color: ReturnType<typeof useTheme>['color'];
}) {
  return (
    <View style={styles.iconWrap}>
      <Icon
        size={19}
        color={focused ? color.accentText : color.textMuted}
        strokeWidth={focused ? 2.5 : 1.7}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 30,
    height: 26,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: 1,
    right: 3,
    width: 5,
    height: 5,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
});
