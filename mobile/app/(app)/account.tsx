import { CalendarDays, CircleHelp, ChevronRight, Globe2, KeyRound, LogOut, Mail, Moon, Phone, SquarePen, Sun } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { formatMonthYear } from '../../lib/format';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Screen } from '../../components/ui/Screen';
import { fontFamily, fontSize, radius, spacing, textShadow, useTheme } from '../../lib/theme';
import { useI18n } from '../../lib/i18n';
import { useAuthStore } from '../../store/auth-store';
import type { LucideIcon } from 'lucide-react-native';

export default function AccountScreen() {
  const client = useAuthStore((s) => s.client);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const { color, mode, setMode, isTransitioning } = useTheme();
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [languageOptionsVisible, setLanguageOptionsVisible] = useState(false);
  const [themeToggleMode, setThemeToggleMode] = useState(mode);
  const { language, setLanguage, t } = useI18n();
  const styles = createStyles(color);

  useEffect(() => {
    setThemeToggleMode(mode);
  }, [mode]);

  // Owned here (not inside ThemeToggle) so it survives the floating
  // Modal copy being unmounted/remounted by the transition — see the
  // comment on ThemeToggle's progress prop for why that matters.
  const toggleProgress = useRef(new Animated.Value(mode === 'dark' ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(toggleProgress, {
      toValue: themeToggleMode === 'dark' ? 1 : 0,
      // Close to critically damped (ratio ~0.89): enough stiffness to
      // still feel like a responsive spring, damped just enough to
      // arrive cleanly with no snap or bounce.
      damping: 20,
      stiffness: 140,
      mass: 0.9,
      useNativeDriver: true,
    }).start();
  }, [themeToggleMode, toggleProgress]);

  // The row icon and the real in-place switch below both react instantly
  // via themeToggleMode, ahead of the (necessarily async) screenshot
  // capture in setMode — which means the screenshot can catch the switch
  // mid-animation, and the real switch underneath then keeps animating on
  // its own schedule after the capture, out of step with the frozen copy
  // baked into the overlay: two overlapping appearances of the same icon.
  // A live copy of just the switch renders in a transparent Modal
  // positioned exactly over the real one for the duration of the
  // transition. Modal content is a separate native layer outside the view
  // hierarchy captureRef walks, so it's never part of the frozen
  // screenshot and always paints on top of it — whatever the real switch
  // underneath is doing doesn't matter, it's fully covered the whole time.
  const toggleRef = useRef<View>(null);
  const [floatingToggleRect, setFloatingToggleRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  function handleLogout() {
    if (confirmingLogout) {
      void logout();
      return;
    }
    setConfirmingLogout(true);
  }

  function handleThemeToggle() {
    const nextMode = themeToggleMode === 'dark' ? 'light' : 'dark';
    toggleRef.current?.measureInWindow((x, y, width, height) => {
      setFloatingToggleRect({ x, y, width, height });
    });
    setThemeToggleMode(nextMode);
    setMode(nextMode);
  }

  return (
    <>
    <Screen
      contentContainerStyle={{
        paddingBottom: 64 + spacing.md,
      }}
    >
      <Text style={styles.heading}>{t('account.title')}</Text>

      <View style={styles.profileHeader}>
        <View style={styles.profileTop}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarInitial}>
              {client?.name?.charAt(0).toUpperCase() ?? '?'}
            </Text>
          </View>
          <View style={styles.profileCopy}>
            <Text style={styles.name} numberOfLines={1}>{client?.name}</Text>
            {client?.companyName ? (
              <Text style={styles.company} numberOfLines={1}>{client.companyName}</Text>
            ) : null}
          </View>
        </View>
        <View style={styles.profileDetails}>
          <View style={styles.detailRow}>
            <Mail size={14} color={color.textMuted} strokeWidth={1.8} />
            <Text style={styles.detailText} numberOfLines={1}>{client?.email}</Text>
          </View>
          {client?.phone ? (
            <View style={styles.detailRow}>
              <Phone size={14} color={color.textMuted} strokeWidth={1.8} />
              <Text style={styles.detailText} numberOfLines={1}>{client.phone}</Text>
            </View>
          ) : null}
          {client?.memberSince ? (
            <View style={styles.detailRow}>
              <CalendarDays size={14} color={color.textMuted} strokeWidth={1.8} />
              <Text style={styles.detailText} numberOfLines={1}>
                {t('account.memberSince', { date: formatMonthYear(client.memberSince, language) })}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <PreferenceGroup label={t('account.profile')}>
        <SettingsRow
          icon={SquarePen}
          label={t('account.editProfile')}
          onPress={() => router.push({ pathname: '/settings/edit-profile', params: { source: 'account' } })}
          styles={styles}
        />
        <SettingsRow
          icon={KeyRound}
          label={t('account.changePassword')}
          onPress={() => router.push({ pathname: '/settings/change-password', params: { source: 'account' } })}
          styles={styles}
          last
        />
      </PreferenceGroup>

      <PreferenceGroup label={t('ui.settings')}>
        <SettingsRow
          icon={Globe2}
          label={t('account.language')}
          value={language === 'en' ? t('account.english') : language === 'sq' ? t('account.albanian') : t('account.german')}
          onPress={() => setLanguageOptionsVisible((visible) => !visible)}
          styles={styles}
        />
        {languageOptionsVisible && (
          <View style={styles.languageControl}>
          <LanguageOption
            code="EN"
            label={t('account.english')}
            selected={language === 'en'}
            onPress={() => setLanguage('en')}
            styles={styles}
          />
          <LanguageOption
            code="SQ"
            label={t('account.albanian')}
            selected={language === 'sq'}
            onPress={() => setLanguage('sq')}
            styles={styles}
          />
          <LanguageOption
            code="DE"
            label={t('account.german')}
            selected={language === 'de'}
            onPress={() => setLanguage('de')}
            styles={styles}
          />
          </View>
        )}
        <SettingsRow
          iconNode={<ThemeRowIcon progress={toggleProgress} color={color} />}
          label={t('account.theme')}
          onPress={handleThemeToggle}
          styles={styles}
          trailing={
            <View ref={toggleRef} collapsable={false}>
              <ThemeToggle progress={toggleProgress} styles={styles} />
            </View>
          }
        />
        <SettingsRow
          icon={CircleHelp}
          label={t('ui.helpSupport')}
          onPress={() => router.push({ pathname: '/settings/help-support', params: { source: 'account' } })}
          styles={styles}
          last
        />
      </PreferenceGroup>

      {confirmingLogout ? (
        <View style={styles.logoutSection}>
          <View style={styles.confirmActions}>
            <Pressable
              onPress={() => setConfirmingLogout(false)}
              style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
            >
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [styles.confirmLogoutButton, pressed && styles.pressed]}
            >
              <Text style={styles.logoutText}>{t('account.logOut')}</Text>
            </Pressable>
          </View>
          <Text style={styles.confirmText}>{t('account.confirmLogOut')}</Text>
        </View>
      ) : (
        <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}
          >
          <LogOut size={16} color={color.danger} />
          <Text style={styles.primaryLogoutText}>{t('account.logOut')}</Text>
        </Pressable>
      )}

      <Text style={styles.footer}>{t('account.version')}</Text>
    </Screen>
    {isTransitioning && floatingToggleRect ? (
      <Modal transparent visible animationType="none" statusBarTranslucent>
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: floatingToggleRect.x,
            top: floatingToggleRect.y,
            width: floatingToggleRect.width,
            height: floatingToggleRect.height,
          }}
        >
          <ThemeToggle progress={toggleProgress} styles={styles} />
        </View>
      </Modal>
    ) : null}
    </>
  );
}

function PreferenceGroup({ label, children }: { label: string; children: ReactNode }) {
  const { color } = useTheme();
  const styles = createStyles(color);
  return (
    <View style={styles.preferenceGroup}>
      <Text style={styles.preferenceLabel}>{label}</Text>
      <View style={styles.preferenceOptions}>
        {children}
      </View>
    </View>
  );
}

function SettingsRow({
  icon: Icon,
  iconNode,
  label,
  value,
  onPress,
  styles,
  last = false,
  trailing,
}: {
  icon?: LucideIcon;
  iconNode?: ReactNode;
  label: string;
  value?: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  last?: boolean;
  trailing?: ReactNode;
}) {
  const { color } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.settingsRow, last && styles.settingsRowLast, pressed && styles.pressed]}
    >
      <View style={styles.settingsIcon}>
        {iconNode ?? (Icon ? <Icon size={16} color={color.textSecondary} strokeWidth={1.8} /> : null)}
      </View>
      <Text style={styles.settingsLabel}>{label}</Text>
      {trailing ? <View style={styles.trailingControl}>{trailing}</View> : (
        <>
          {value ? <Text style={styles.settingsValue}>{value}</Text> : null}
          <ChevronRight size={16} color={color.textMuted} strokeWidth={1.8} />
        </>
      )}
    </Pressable>
  );
}

// The settings row's leading icon used to be `themeToggleMode === 'dark' ?
// Moon : Sun` — a plain ternary, so it hard-snapped the instant you tapped,
// well before the screenshot crossfade even starts capturing (setMode's
// capture is necessarily async). Unlike the switch thumb, which gets a
// floating live copy to cover exactly this gap (see toggleRef above), this
// icon had no such cover, so the snap was fully visible for a beat — likely
// what read as "glitchy". Cross-fading it on the same shared `progress`
// value as the switch's own sun/moon icons turns that into one continuous
// motion instead of an instant flash.
function ThemeRowIcon({
  progress,
  color,
}: {
  progress: Animated.Value;
  color: ReturnType<typeof useTheme>['color'];
}) {
  const sunOpacity = progress.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [1, 0, 0],
  });
  const moonOpacity = progress.interpolate({
    inputRange: [0, 0.55, 1],
    outputRange: [0, 0, 1],
  });
  return (
    <View style={{ width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ position: 'absolute', opacity: sunOpacity }}>
        <Sun size={16} color={color.textSecondary} strokeWidth={1.8} />
      </Animated.View>
      <Animated.View style={{ position: 'absolute', opacity: moonOpacity }}>
        <Moon size={16} color={color.textSecondary} strokeWidth={1.8} />
      </Animated.View>
    </View>
  );
}

function ThemeToggle({
  progress,
  styles,
}: {
  // Owned by the caller (AccountScreen), not created here. The floating
  // Modal copy of this component gets fully unmounted and remounted by
  // RN's Modal every time the transition starts and ends (Modal discards
  // children when not visible), which would reset a locally-owned
  // Animated.Value straight to its resting position with nothing left to
  // animate — the switch would just pop instead of sliding. Sharing one
  // value that lives above both render sites means a remount just picks
  // up wherever the animation currently is, in sync with the persistent
  // in-row instance, instead of restarting it.
  progress: Animated.Value;
  styles: ReturnType<typeof createStyles>;
}) {
  const { color } = useTheme();

  const lightTrackOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  const thumbOffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  });
  const sunOpacity = progress.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [1, 0, 0],
  });
  const moonOpacity = progress.interpolate({
    inputRange: [0, 0.55, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <View pointerEvents="none" style={styles.themeToggle}>
      <View style={styles.themeToggleTrack}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#1B332D' }]} />
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: '#E9ECE7', opacity: lightTrackOpacity }]}
        />
        <Animated.View style={[styles.themeToggleThumb, { transform: [{ translateX: thumbOffset }] }]}>
          <Animated.View style={[styles.themeToggleIcon, { opacity: sunOpacity }]}>
            <Sun size={15} color={color.accent} strokeWidth={1.8} />
          </Animated.View>
          <Animated.View style={[styles.themeToggleIcon, { opacity: moonOpacity }]}>
            <Moon size={15} color={color.accent} strokeWidth={1.8} />
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  );
}

function LanguageOption({
  code,
  label,
  selected,
  onPress,
  styles,
}: {
  code: string;
  label: string;
  selected: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.languageOption,
        selected && styles.languageOptionSelected,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.languageCode, selected && styles.languageCodeSelected]}>
        <Text style={[styles.languageCodeText, selected && styles.languageCodeTextSelected]}>
          {code}
        </Text>
      </View>
      <Text style={[styles.languageOptionText, selected && styles.languageOptionTextSelected]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function createStyles(color: ReturnType<typeof useTheme>['color']) {
  return StyleSheet.create({
    heading: {
      ...textShadow,
      fontFamily: fontFamily.serif,
      fontSize: fontSize.headingLg,
      color: color.textPrimary,
      marginBottom: spacing.xl,
    },
    profileHeader: {
      marginBottom: spacing.md,
      padding: spacing.lg,
      backgroundColor: color.surface,
      borderWidth: 1,
      borderColor: color.border,
      borderRadius: radius.lg,
    },
    profileTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.lg,
    },
    avatarWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: color.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitial: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.heading,
      color: color.accent,
    },
    profileCopy: {
      flex: 1,
      minWidth: 0,
    },
    name: {
      ...textShadow,
      fontFamily: fontFamily.serif,
      fontSize: fontSize.heading,
      color: color.textPrimary,
    },
    company: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.caption,
      color: color.textMuted,
      marginTop: spacing.xs,
    },
    profileDetails: {
      marginTop: spacing.lg,
      paddingTop: spacing.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: color.border,
      gap: spacing.sm,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    detailText: {
      flex: 1,
      minWidth: 0,
      fontFamily: fontFamily.regular,
      fontSize: 13,
      color: color.textSecondary,
    },
    preferenceGroup: {
      marginBottom: spacing.md,
    },
    preferenceLabel: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.meta,
      color: color.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.lg,
    },
    preferenceOptions: {
      gap: 0,
      backgroundColor: color.surface,
      borderWidth: 1,
      borderColor: color.border,
      borderRadius: radius.lg,
      overflow: 'hidden',
    },
    settingsRow: {
      minHeight: 56,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: color.border,
    },
    settingsRowLast: {
      borderBottomWidth: 0,
    },
    settingsIcon: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: color.surfaceMuted,
    },
    settingsLabel: {
      flex: 1,
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.body,
      color: color.textPrimary,
    },
    settingsValue: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.meta,
      color: color.textMuted,
    },
    trailingControl: {
      width: 52,
      height: 32,
      marginRight: spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    themeToggle: {
      width: 52,
      height: 32,
    },
    themeToggleTrack: {
      width: 52,
      height: 32,
      borderRadius: radius.pill,
      justifyContent: 'center',
      overflow: 'hidden',
    },
    themeToggleThumb: {
      position: 'absolute',
      left: 0,
      width: 28,
      height: 28,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: color.surface,
    },
    themeToggleIcon: {
      position: 'absolute',
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    languageControl: {
      gap: 0,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: color.border,
    },
    languageOption: {
      minHeight: 56,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderRadius: 0,
      backgroundColor: color.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: color.border,
    },
    languageOptionSelected: {
      backgroundColor: color.accentSoft,
    },
    languageCode: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: color.surfaceMuted,
    },
    languageCodeSelected: {
      backgroundColor: color.accent,
    },
    languageCodeText: {
      fontFamily: fontFamily.semibold,
      fontSize: 10,
      color: color.textPrimary,
      letterSpacing: 0.4,
    },
    languageCodeTextSelected: {
      color: color.textOnAccent,
    },
    languageOptionText: {
      flex: 1,
      minWidth: 0,
      fontFamily: fontFamily.medium,
      fontSize: fontSize.meta,
      color: color.textPrimary,
    },
    languageOptionTextSelected: {
      color: color.textPrimary,
    },
    logoutButton: {
      height: 56,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      borderRadius: radius.lg,
      backgroundColor: color.dangerBg,
    },
    logoutSection: {
      gap: spacing.md,
    },
    confirmActions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    cancelButton: {
      flex: 1,
      height: 48,
      borderRadius: radius.pill,
      backgroundColor: color.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    confirmLogoutButton: {
      flex: 1,
      height: 48,
      borderRadius: radius.pill,
      backgroundColor: color.dangerBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelText: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.caption,
      color: color.textSecondary,
    },
    logoutText: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.caption,
      color: color.danger,
    },
    primaryLogoutText: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.caption,
      color: color.danger,
    },
    confirmText: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.meta,
      color: color.textMuted,
      textAlign: 'center',
    },
    pressed: {
      opacity: 0.72,
    },
    footer: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.meta,
      color: color.textMuted,
      textAlign: 'center',
      marginTop: spacing.xl,
    },
  });
}
