import { LogOut, Monitor, Moon, Sun } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, type ReactNode } from 'react';
import { Screen } from '../../components/ui/Screen';
import { fontFamily, fontSize, radius, spacing, useTheme } from '../../lib/theme';
import type { ThemeMode } from '../../lib/theme';
import { useI18n } from '../../lib/i18n';
import { useAuthStore } from '../../store/auth-store';

export default function AccountScreen() {
  const client = useAuthStore((s) => s.client);
  const logout = useAuthStore((s) => s.logout);
  const insets = useSafeAreaInsets();
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const { color, mode, setMode } = useTheme();
  const { language, setLanguage, t } = useI18n();
  const styles = createStyles(color);

  function handleLogout() {
    if (confirmingLogout) {
      void logout();
      return;
    }
    setConfirmingLogout(true);
  }

  return (
    <Screen
      contentContainerStyle={{
        paddingTop: insets.top + spacing.lg,
        paddingBottom: 64 + spacing.md,
      }}
    >
      <Text style={styles.heading}>{t('account.title')}</Text>

      <View style={styles.profileHeader}>
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarInitial}>
            {client?.name?.charAt(0).toUpperCase() ?? '?'}
          </Text>
        </View>
        <View style={styles.profileCopy}>
          <Text style={styles.name}>{client?.name}</Text>
          <Text style={styles.company}>{client?.companyName}</Text>
        </View>
      </View>

      <View style={styles.infoSection}>
        <InfoRow label={t('account.email')} value={client?.email ?? ''} />
        <InfoRow label={t('account.company')} value={client?.companyName ?? ''} last />
      </View>

      <PreferenceGroup label={t('account.theme')}>
        <View style={styles.themeControl}>
          <ThemeOption
            icon={Monitor}
            label={t('account.system')}
            selected={mode === 'system'}
            onPress={() => setMode('system')}
            styles={styles}
          />
          <ThemeOption
            icon={Sun}
            label={t('account.light')}
            selected={mode === 'light'}
            onPress={() => setMode('light')}
            styles={styles}
          />
          <ThemeOption
            icon={Moon}
            label={t('account.dark')}
            selected={mode === 'dark'}
            onPress={() => setMode('dark')}
            styles={styles}
          />
        </View>
      </PreferenceGroup>

      <PreferenceGroup label={t('account.language')}>
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
          <Text style={styles.logoutText}>{t('account.logOut')}</Text>
        </Pressable>
      )}

      <Text style={styles.footer}>{t('account.version')}</Text>
    </Screen>
  );
}

function InfoRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  const { color } = useTheme();
  const styles = createStyles(color);
  return (
    <View style={[styles.infoRow, last && styles.infoRowLast]}>
      <View style={styles.infoTextCol}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

function PreferenceGroup({ label, children }: { label: string; children: ReactNode }) {
  const { color } = useTheme();
  const styles = createStyles(color);
  return (
    <View style={styles.preferenceGroup}>
      <Text style={styles.preferenceLabel}>{label}</Text>
      <View style={styles.preferenceOptions}>{children}</View>
    </View>
  );
}

function ThemeOption({
  icon: Icon,
  label,
  selected,
  onPress,
  styles,
}: {
  icon: LucideIcon;
  label: string;
  selected: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  const { color } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.themeOption,
        selected && styles.themeOptionSelected,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.themeIcon, selected && styles.themeIconSelected]}>
        <Icon size={17} color={selected ? color.textPrimary : color.textMuted} strokeWidth={1.9} />
      </View>
      <Text style={[styles.themeOptionText, selected && styles.themeOptionTextSelected]}>
        {label}
      </Text>
    </Pressable>
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
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.headingLg,
      color: color.textPrimary,
      marginBottom: spacing.xl,
    },
    profileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xl,
    },
    avatarWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: color.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitial: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.heading,
      color: color.accentPressed,
    },
    profileCopy: {
      flex: 1,
      marginLeft: spacing.md,
    },
    name: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.sectionTitle,
      color: color.textPrimary,
    },
    company: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.caption,
      color: color.textMuted,
      marginTop: 2,
    },
    infoSection: {
      backgroundColor: color.surface,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.xl,
      borderRadius: radius.lg,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
    },
    infoRowLast: {},
    infoTextCol: {
      flex: 1,
    },
    infoLabel: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.meta,
      color: color.textMuted,
    },
    infoValue: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.caption,
      color: color.textPrimary,
      marginTop: 2,
    },
    preferenceGroup: {
      marginBottom: spacing.lg,
    },
    preferenceLabel: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.caption,
      color: color.textSecondary,
      marginBottom: spacing.sm,
    },
    preferenceOptions: {
      gap: spacing.xs,
    },
    themeControl: {
      flexDirection: 'row',
      gap: spacing.xs,
      padding: spacing.xs,
      borderRadius: radius.lg,
      backgroundColor: color.surfaceMuted,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: color.border,
    },
    themeOption: {
      flex: 1,
      minHeight: 66,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      borderRadius: radius.md,
      backgroundColor: color.surface,
    },
    themeOptionSelected: {
      backgroundColor: color.accentSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: color.borderStrong,
    },
    themeIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: color.surfaceMuted,
    },
    themeIconSelected: {
      backgroundColor: color.surface,
    },
    themeOptionText: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.meta,
      color: color.textMuted,
      textAlign: 'center',
    },
    themeOptionTextSelected: {
      color: color.textPrimary,
    },
    languageControl: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    languageOption: {
      flex: 1,
      minHeight: 56,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.lg,
      backgroundColor: color.surface,
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
      color: color.textMuted,
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
      color: color.textMuted,
    },
    languageOptionTextSelected: {
      color: color.textPrimary,
    },
    logoutButton: {
      height: 44,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: color.dangerBorder,
      borderRadius: radius.md,
      backgroundColor: color.surface,
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
      height: 44,
      borderRadius: radius.md,
      backgroundColor: color.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    confirmLogoutButton: {
      flex: 1,
      height: 44,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: color.dangerBorder,
      borderRadius: radius.md,
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
      marginTop: spacing.xxl,
    },
  });
}
