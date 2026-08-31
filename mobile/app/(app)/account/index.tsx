import {
  CalendarDays,
  ChevronRight,
  CircleHelp,
  Globe2,
  LogOut,
  Mail,
  Moon,
  Phone,
  Sun,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { Screen } from '../../../components/ui/Screen';
import { formatMonthYear } from '../../../lib/format';
import { useI18n } from '../../../lib/i18n';
import {
  fontFamily,
  fontSize,
  radius,
  spacing,
  textShadow,
  useTheme,
} from '../../../lib/theme';
import { useSingleFire } from '../../../lib/use-single-fire';
import { useAuthStore } from '../../../store/auth-store';
import type { LucideIcon } from 'lucide-react-native';

// LayoutAnimation needs to be opted into on Android; iOS has it on by
// default. No-op if already enabled or unsupported.
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function AccountScreen() {
  const client = useAuthStore((state) => state.client);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();
  const navigateTo = useSingleFire((href: Parameters<typeof router.push>[0]) => router.push(href));
  const { color, mode, setMode, isTransitioning } = useTheme();
  const { language, setLanguage, t } = useI18n();
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [languageOptionsVisible, setLanguageOptionsVisible] = useState(false);
  const [themeToggleMode, setThemeToggleMode] = useState(mode);
  const styles = createStyles(color, mode);

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

  function toggleLanguageOptions() {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        220,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity,
      ),
    );
    setLanguageOptionsVisible((visible) => !visible);
  }

  function confirmLogout() {
    setConfirmingLogout(false);
    void logout();
  }

  function measureThemeToggle() {
    toggleRef.current?.measureInWindow((x, y, width, height) => {
      setFloatingToggleRect({ x, y, width, height });
    });
  }

  function handleThemeToggle() {
    const nextMode = themeToggleMode === 'dark' ? 'light' : 'dark';
    measureThemeToggle();
    setThemeToggleMode(nextMode);
    setMode(nextMode);
  }

  return (
    <>
      <Screen contentContainerStyle={styles.screenContent}>
        <Text style={styles.heading}>{t('account.title')}</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('account.editProfile')}
          onPress={() => navigateTo('/account/edit-profile')}
          style={({ pressed }) => [styles.profileHeader, pressed && styles.pressed]}
        >
          <View style={styles.profileTop}>
            <View style={styles.avatarWrap}>
              <Text style={styles.avatarInitial}>
                {client?.name?.charAt(0).toUpperCase() ?? '?'}
              </Text>
            </View>
            <View style={styles.profileCopy}>
              <Text style={styles.name} numberOfLines={1}>
                {client?.name}
              </Text>
              {client?.companyName ? (
                <Text style={styles.company} numberOfLines={1}>
                  {client.companyName}
                </Text>
              ) : null}
            </View>
            <ChevronRight size={18} color={color.textMuted} strokeWidth={1.8} />
          </View>

          <View style={styles.profileDetails}>
            <View style={styles.detailRow}>
              <Mail size={14} color={color.textMuted} strokeWidth={1.8} />
              <Text style={styles.detailText} numberOfLines={1}>
                {client?.email}
              </Text>
            </View>
            {client?.phone ? (
              <View style={styles.detailRow}>
                <Phone size={14} color={color.textMuted} strokeWidth={1.8} />
                <Text style={styles.detailText} numberOfLines={1}>
                  {client.phone}
                </Text>
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
        </Pressable>

        <SettingsSection label={t('account.preferences')} styles={styles}>
          <SettingsRow
            icon={Globe2}
            label={t('account.language')}
            value={
              language === 'en'
                ? t('account.english')
                : language === 'sq'
                  ? t('account.albanian')
                  : t('account.german')
            }
            onPress={toggleLanguageOptions}
            styles={styles}
          />
          {languageOptionsVisible ? (
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
          ) : null}
          <SettingsRow
            iconNode={<ThemeRowIcon progress={toggleProgress} color={color.textSecondary} />}
            label={t('account.theme')}
            onPress={handleThemeToggle}
            styles={styles}
            trailing={
              <View ref={toggleRef} collapsable={false} onLayout={measureThemeToggle}>
                <ThemeToggle progress={toggleProgress} styles={styles} />
              </View>
            }
            last
          />
        </SettingsSection>

        <SettingsSection label={t('account.support')} styles={styles}>
          <SettingsRow
            icon={CircleHelp}
            label={t('ui.helpSupport')}
            onPress={() => navigateTo('/account/help-support')}
            styles={styles}
            last
          />
        </SettingsSection>

        <Pressable
          accessibilityRole="button"
          onPress={() => setConfirmingLogout(true)}
          disabled={confirmingLogout}
          style={({ pressed }) => [
            styles.logoutRow,
            confirmingLogout && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <LogOut size={17} color={color.danger} strokeWidth={1.8} />
          <Text style={styles.logoutRowText}>{t('account.logOut')}</Text>
        </Pressable>

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

      <Modal
        transparent
        visible={confirmingLogout}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setConfirmingLogout(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setConfirmingLogout(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.confirmText}>{t('account.confirmLogOut')}</Text>
            <View style={styles.confirmActions}>
              <Pressable
                onPress={() => setConfirmingLogout(false)}
                style={({ pressed }) => [styles.confirmButton, styles.cancelButton, pressed && styles.pressed]}
              >
                <Text style={styles.cancelText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                onPress={confirmLogout}
                style={({ pressed }) => [
                  styles.confirmButton,
                  styles.confirmLogoutButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.confirmLogoutText}>{t('account.logMeOut')}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function SettingsSection({
  label,
  styles,
  children,
}: {
  label: string;
  styles: ReturnType<typeof createStyles>;
  children: ReactNode;
}) {
  return (
    <View style={styles.settingsSection}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.sectionRows}>{children}</View>
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
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.settingsRow, !last && styles.settingsRowDivider, pressed && styles.pressed]}
    >
      <View style={styles.settingsLeading}>
        <View style={styles.settingsIcon}>
          {iconNode ?? (Icon ? <Icon size={17} color={color.textSecondary} strokeWidth={1.8} /> : null)}
        </View>
        <Text style={styles.settingsLabel}>{label}</Text>
      </View>
      {trailing ? (
        <View style={styles.trailingControl}>{trailing}</View>
      ) : (
        <>
          {value ? (
            <Text style={styles.settingsValue} numberOfLines={1}>
              {value}
            </Text>
          ) : null}
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
  color: string;
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
        <Sun size={16} color={color} strokeWidth={1.8} />
      </Animated.View>
      <Animated.View style={{ position: 'absolute', opacity: moonOpacity }}>
        <Moon size={16} color={color} strokeWidth={1.8} />
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
        <Animated.View
          style={[styles.themeToggleThumb, { transform: [{ translateX: thumbOffset }] }]}
        >
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#1A2224' }]} />
          <Animated.View
            style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF', opacity: lightTrackOpacity }]}
          />
          <Animated.View style={[styles.themeToggleIcon, { opacity: sunOpacity }]}>
            <Sun size={15} color="#1D6F5B" strokeWidth={1.8} />
          </Animated.View>
          <Animated.View style={[styles.themeToggleIcon, { opacity: moonOpacity }]}>
            <Moon size={15} color="#2FBF9F" strokeWidth={1.8} />
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
      <Text
        style={[styles.languageOptionText, selected && styles.languageOptionTextSelected]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function createStyles(
  color: ReturnType<typeof useTheme>['color'],
  mode: ReturnType<typeof useTheme>['mode'],
) {
  const confirmLogoutColor = mode === 'dark' ? color.textOnAccent : color.danger;

  return StyleSheet.create({
    screenContent: {
      paddingBottom: 64 + spacing.sm,
    },
    heading: {
      ...textShadow,
      fontFamily: fontFamily.serif,
      fontSize: fontSize.headingLg,
      color: color.textPrimary,
      marginBottom: spacing.xl,
    },
    profileHeader: {
      marginBottom: spacing.lg,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xl,
      backgroundColor: color.surface,
      borderWidth: 1,
      borderColor: mode === 'light' ? color.border : 'transparent',
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
      borderRadius: radius.pill,
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
      marginTop: spacing.xl,
      paddingTop: spacing.xl,
      borderTopWidth: 1,
      borderTopColor: color.border,
      gap: spacing.md,
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
    settingsSection: {
      marginBottom: spacing.lg,
    },
    sectionLabel: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.meta,
      color: color.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.xs,
    },
    sectionRows: {
      backgroundColor: color.surface,
      borderWidth: 1,
      borderColor: mode === 'light' ? color.border : 'transparent',
      borderRadius: radius.lg,
      overflow: 'hidden',
    },
    settingsRow: {
      minHeight: 56,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
    settingsRowDivider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: color.border,
    },
    settingsLeading: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    settingsIcon: {
      width: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    settingsLabel: {
      flex: 1,
      fontFamily: fontFamily.medium,
      fontSize: fontSize.body,
      lineHeight: 20,
      color: color.textPrimary,
    },
    settingsValue: {
      maxWidth: 112,
      fontFamily: fontFamily.regular,
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
      overflow: 'hidden',
    },
    themeToggleIcon: {
      position: 'absolute',
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoutRow: {
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      marginTop: spacing.xs,
      backgroundColor: color.surface,
      borderWidth: 1,
      borderColor: mode === 'light' ? color.border : 'transparent',
      borderRadius: radius.lg,
    },
    logoutRowText: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.body,
      color: color.danger,
    },
    disabled: {
      opacity: 0.45,
    },
    footer: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.meta,
      color: color.textMuted,
      textAlign: 'center',
      marginTop: spacing.lg,
    },
    pressed: {
      opacity: 0.72,
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
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
    },
    modalCard: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: color.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      gap: spacing.lg,
    },
    confirmActions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    confirmButton: {
      flex: 1,
      height: 44,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButton: {
      backgroundColor: color.surfaceMuted,
    },
    confirmLogoutButton: {
      backgroundColor: color.dangerBorder,
    },
    cancelText: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.caption,
      color: color.textSecondary,
    },
    confirmLogoutText: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.caption,
      color: confirmLogoutColor,
    },
    confirmText: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.cardTitle,
      color: color.textPrimary,
      textAlign: 'center',
    },
  });
}
