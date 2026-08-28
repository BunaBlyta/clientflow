import { Tabs } from 'expo-router';
import { Bell, FileText, FolderKanban, House, UserRound } from 'lucide-react-native';
import { useEffect } from 'react';
import { Easing, Platform, StyleSheet, View } from 'react-native';
import { radius, spacing, useTheme } from '../../lib/theme';
import { useI18n } from '../../lib/i18n';
import { useAuthStore } from '../../store/auth-store';
import { useDataStore } from '../../store/data-store';

const TAB_BAR_HEIGHT = 60;
const TAB_BAR_SIDE_MARGIN = spacing.lg;
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
  const token = useAuthStore((s) => s.token);
  const refreshNotifications = useDataStore((s) => s.refreshNotifications);
  const unread = useDataStore((s) => s.unreadNotificationCount());

  useEffect(() => {
    if (token) void refreshNotifications(token);
  }, [refreshNotifications, token]);

  return (
    // The pill floats via margin, not position:absolute (see the note on
    // tabBarStyle below), so the tab bar's own reserved band still spans
    // full width/height behind it — without this wrapper that band paints
    // with the navigator's own default background, not the app's own.
    // Deliberately matches the pill's own navBackground (white), not the
    // page canvas (a very slightly grey off-white, #F5F6F3) — canvas was
    // never visibly distinct from white when the bar was a flush,
    // full-width strip, but became a visible seam around the pill's
    // margins once there was a gap for it to show through.
    <View style={{ flex: 1, backgroundColor: color.navBackground }}>
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
          // Matches navBackground, not the page canvas — the shift
          // animation renders scenes absolutely, so this color is what
          // shows in the sliver behind the tab bar's margin gap, below
          // where each screen's own Screen/SafeAreaView content ends.
          sceneStyle: { backgroundColor: color.navBackground },
        tabBarActiveTintColor: color.navActive,
        tabBarInactiveTintColor: color.navInactive,
        tabBarShowLabel: false,
        // A floating pill, not the full-width bar this used to be: inset
        // from both edges and fully rounded. Margin (not position:
        // absolute) so it still reserves its own layout space below the
        // scenes — no risk of the last row of content hiding behind it.
        tabBarStyle: {
          height: TAB_BAR_HEIGHT,
          marginHorizontal: TAB_BAR_SIDE_MARGIN,
          // A small fixed gap regardless of the home-indicator inset — the
          // pill sits low, close to the edge, rather than scaling its
          // position with however tall that inset is on a given device.
          marginBottom: spacing.lg,
          borderRadius: radius.pill,
          backgroundColor: color.navBackground,
          borderTopWidth: 0,
          paddingTop: 0,
          paddingBottom: 0,
          shadowColor: '#000',
          shadowOpacity: 0.12,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: 12,
        },
        tabBarItemStyle: {
          height: TAB_BAR_HEIGHT,
          paddingTop: 0,
          paddingBottom: 0,
          alignItems: 'center',
          justifyContent: 'center',
        },
        // Zeroes out bottom-tabs' built-in icon margin (sized to leave room
        // for a label underneath, which no longer renders), then nudges the
        // icon down a few px from dead-center — sitting exactly in the
        // geometric middle of the pill read as slightly too high.
        tabBarIconStyle: {
          marginTop: 10,
          marginBottom: 0,
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
    </Tabs>
    </View>
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
