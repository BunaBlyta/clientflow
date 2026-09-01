import { Tabs, usePathname } from 'expo-router';
import { Bell, FileText, FolderKanban, House, UserRound } from 'lucide-react-native';
import { useEffect } from 'react';
import { Easing, Platform, StyleSheet, View } from 'react-native';
import { radius, useTheme } from '../../lib/theme';
import { useI18n } from '../../lib/i18n';
import { useAuthStore } from '../../store/auth-store';
import { useDataStore } from '../../store/data-store';
import { TAB_BAR_BOTTOM_MARGIN, TAB_BAR_HEIGHT, TAB_BAR_SIDE_MARGIN } from '../../lib/tab-bar';

const TAB_TRANSITION_DISTANCE = 16;
const TAB_TRANSITION_DURATION = 220;

// A small fade alongside the slide — a pure translateX with no opacity
// change reads as a hard, mechanical cut once the outgoing/incoming scenes
// overlap; blending both softens the handoff into something that actually
// looks smooth rather than just fast.
const tabSceneStyleInterpolator = ({
  current,
}: {
  current: { progress: import('react-native').Animated.Value };
}) => ({
  sceneStyle: {
    opacity: current.progress.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: [0, 1, 0],
    }),
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
  // The project chat (notes) screen puts its own composer pill where the tab
  // bar sits, so the tab bar is hidden there — otherwise the two pills stack
  // and the composer's send button ends up behind the bar. Matches both the
  // projects-tab route (/projects/[id]/notes) and the notifications-tab one
  // (/notifications/projects/[id]/notes).
  const pathname = usePathname();
  const hideTabBar = pathname.endsWith('/notes');

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
        sceneStyle: { backgroundColor: color.background },
        tabBarActiveTintColor: color.navActive,
        tabBarInactiveTintColor: color.navInactive,
        tabBarShowLabel: false,
        // A genuine floating overlay, like Instagram/WhatsApp: position
        // absolute so the pill sits on top of scrolling content rather than
        // reserving its own dedicated band below it. The bar's own
        // container has no background (nothing to paint outside the pill
        // shape itself), so content is visible right up through the
        // transparent gutter around it — only the opaque, rounded pill body
        // actually covers anything. Screen.tsx's TAB_BAR_CLEARANCE gives
        // scroll content enough bottom padding that the last item settles
        // above the pill instead of ending up hidden underneath it.
        tabBarStyle: {
          // Hidden on the chat/notes screen, whose composer pill takes this
          // pill's place. `display` toggles cleanly here; the bar animates
          // back in on the way out of that screen.
          display: hideTabBar ? 'none' : 'flex',
          position: 'absolute',
          // The library's own base style (styles.bottom in BottomTabBar.js)
          // sets start:0/end:0 — RTL-aware logical properties, which RN
          // treats as distinct from left/right rather than being
          // overridden by them. Setting only left/right left start/end at
          // their library default of 0 (full width) in the flattened
          // style, fighting with these — set all four so nothing is left
          // ambiguous between the two property pairs.
          left: TAB_BAR_SIDE_MARGIN,
          right: TAB_BAR_SIDE_MARGIN,
          start: TAB_BAR_SIDE_MARGIN,
          end: TAB_BAR_SIDE_MARGIN,
          bottom: TAB_BAR_BOTTOM_MARGIN,
          height: TAB_BAR_HEIGHT,
          borderRadius: radius.pill,
          backgroundColor: color.navBackground,
          borderTopWidth: 0,
          paddingTop: 0,
          paddingBottom: 0,
          // bottom-tabs' own internal style computation (BottomTabBar.js)
          // sets paddingHorizontal: Math.max(insets.left, insets.right)
          // ahead of this style object in its merge array — left
          // unaccounted for, that's free to squeeze the row of icons in
          // from both sides while the pill's own outer width (left/right
          // above) stays the same, which is what "stretched" actually
          // was: a fixed-width pill with its content compressed narrower
          // than its own shape.
          paddingHorizontal: 0,
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
          // Project detail/chat/invoice screens live inside this tab's nested
          // stack. Never leave one of them as the tab's remembered landing
          // screen after the user navigates elsewhere.
          popToTopOnBlur: true,
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
