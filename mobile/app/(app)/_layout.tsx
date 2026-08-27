import { Tabs } from 'expo-router';
import { Bell, FileText, FolderKanban, House, UserRound } from 'lucide-react-native';
import { useEffect } from 'react';
import { Easing, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontFamily, radius, spacing, useTheme } from '../../lib/theme';
import { useI18n } from '../../lib/i18n';
import { useAuthStore } from '../../store/auth-store';
import { useDataStore } from '../../store/data-store';

const TAB_BAR_HEIGHT = 68;
const TAB_TRANSITION_DISTANCE = 24;
const TAB_TRANSITION_DURATION = 180;

const tabSceneStyleInterpolator = ({
  current,
}: {
  current: { progress: import('react-native').Animated.Value };
}) => ({
  sceneStyle: {
    transform: [
      {
        translateX: current.progress.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: [-TAB_TRANSITION_DISTANCE, 0, TAB_TRANSITION_DISTANCE],
        }),
      },
    ],
  },
});

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
      detachInactiveScreens={false}
      screenOptions={{
        headerShown: false,
        lazy: false,
        // Tried detachInactiveScreens + freezeOnBlur (react-freeze) here to
        // stop inactive tabs re-rendering on theme change, but freezing and
        // then un-freezing a tab on every switch made core tab navigation
        // itself feel laggy — a worse trade than the theme toggle issue it
        // was meant to fix. Reverted; the theme toggle's actual bug turned
        // out to be a visual one (see lib/theme.ts), not this.
        animation: Platform.OS === 'web' ? 'none' : 'shift',
        sceneStyleInterpolator: tabSceneStyleInterpolator,
        transitionSpec: {
          animation: 'timing',
          config: {
            duration: TAB_TRANSITION_DURATION,
            easing: Easing.out(Easing.cubic),
          },
        },
          sceneStyle: { backgroundColor: color.canvas },
        tabBarActiveTintColor: color.navActive,
        tabBarInactiveTintColor: color.navInactive,
        tabBarStyle: {
          height: TAB_BAR_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: spacing.xs,
          backgroundColor: color.navBackground,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: color.border,
          shadowOpacity: 0,
          elevation: 0,
        },
        tabBarItemStyle: {
          paddingTop: 0,
          paddingBottom: 0,
        },
        tabBarLabelStyle: {
          fontFamily: fontFamily.regular,
          fontSize: 11,
          fontWeight: '400',
          marginTop: spacing.sm,
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
          tabBarIcon: ({ focused }) => <TabIcon icon={Bell} focused={focused} color={color} />,
          tabBarBadge: unread > 0 ? unread : undefined,
          tabBarBadgeStyle: { backgroundColor: color.danger },
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: t('tabs.account'),
          tabBarIcon: ({ focused }) => <TabIcon icon={UserRound} focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen name="settings" options={{ href: null }} />
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
    <View style={[styles.iconWrap, focused && { backgroundColor: color.navActiveBg }]}>
      <Icon
        size={23}
        color={focused ? color.navActive : color.navInactive}
        strokeWidth={focused ? 1.8 : 1.6}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 44,
    height: 34,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
