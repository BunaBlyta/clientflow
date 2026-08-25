import { CircleHelp, ChevronRight, Globe2, LogOut, Moon, Sun } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useState, type ReactNode } from 'react';
import { Screen } from '../../components/ui/Screen';
import { fontFamily, fontSize, radius, spacing, textShadow, useTheme } from '../../lib/theme';
import { useI18n } from '../../lib/i18n';
import { useAuthStore } from '../../store/auth-store';
import type { LucideIcon } from 'lucide-react-native';

export default function AccountScreen() {
  const client = useAuthStore((s) => s.client);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [languageOptionsVisible, setLanguageOptionsVisible] = useState(false);
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
          <Text style={styles.email}>{client?.email}</Text>
          <Text style={styles.company}>{client?.companyName}</Text>
        </View>
      </View>

      <PreferenceGroup label="Settings">
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
          icon={mode === 'dark' ? Moon : Sun}
          label={t('account.theme')}
          value={mode === 'dark' ? t('account.dark') : t('account.light')}
          onPress={() => setMode(mode === 'dark' ? 'light' : 'dark')}
          styles={styles}
        />
        <SettingsRow
          icon={CircleHelp}
          label="Help & Support"
          onPress={() => router.push('/settings/help-support')}
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
          <Text style={styles.logoutText}>{t('account.logOut')}</Text>
        </Pressable>
      )}

      <Text style={styles.footer}>{t('account.version')}</Text>
    </Screen>
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

function SettingsRow({
  icon: Icon,
  label,
  value,
  onPress,
  styles,
  last = false,
}: {
  icon: LucideIcon;
  label: string;
  value?: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  last?: boolean;
}) {
  const { color } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.settingsRow, last && styles.settingsRowLast, pressed && styles.pressed]}
    >
      <View style={styles.settingsIcon}>
        <Icon size={16} color={color.textSecondary} strokeWidth={1.8} />
      </View>
      <Text style={styles.settingsLabel}>{label}</Text>
      {value ? <Text style={styles.settingsValue}>{value}</Text> : null}
      <ChevronRight size={16} color={color.textMuted} strokeWidth={1.8} />
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
      ...textShadow,
      fontFamily: fontFamily.serif,
      fontSize: fontSize.heading,
      color: color.textPrimary,
      marginBottom: spacing.xl,
    },
    profileHeader: {
      flexDirection: 'column',
      alignItems: 'center',
      marginBottom: spacing.lg,
      paddingVertical: spacing.xxl,
      paddingHorizontal: spacing.xl,
      backgroundColor: color.surface,
      borderWidth: 1,
      borderColor: color.border,
      borderRadius: radius.lg,
    },
    avatarWrap: {
      width: 72,
      height: 72,
      borderRadius: 36,
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
      alignItems: 'center',
      marginTop: spacing.md,
    },
    name: {
      ...textShadow,
      fontFamily: fontFamily.serif,
      fontSize: fontSize.heading,
      color: color.textPrimary,
    },
    email: {
      fontFamily: fontFamily.regular,
      fontSize: 13,
      color: color.textSecondary,
      marginTop: spacing.xs,
    },
    company: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.caption,
      color: color.textMuted,
      marginTop: spacing.sm,
    },
    preferenceGroup: {
      marginBottom: spacing.lg,
    },
    preferenceLabel: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.meta,
      color: color.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.sm,
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
    languageControl: {
      gap: 0,
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
      height: 56,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      borderRadius: radius.lg,
      backgroundColor: color.surface,
      borderWidth: 1,
      borderColor: color.border,
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
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: color.dangerBorder,
      borderRadius: radius.pill,
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
