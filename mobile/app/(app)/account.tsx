import { LogOut } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useState, type ReactNode } from 'react';
import { Screen } from '../../components/ui/Screen';
import { fontFamily, fontSize, radius, spacing, textShadow, useTheme } from '../../lib/theme';
import { useI18n } from '../../lib/i18n';
import { useAuthStore } from '../../store/auth-store';

export default function AccountScreen() {
  const client = useAuthStore((s) => s.client);
  const logout = useAuthStore((s) => s.logout);
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const { color } = useTheme();
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
      fontFamily: fontFamily.bold,
      fontSize: fontSize.headingLg,
      color: color.textPrimary,
      marginBottom: spacing.lg,
    },
    profileHeader: {
      flexDirection: 'column',
      alignItems: 'center',
      marginBottom: spacing.lg,
      padding: spacing.xl,
      backgroundColor: color.surface,
      borderWidth: 1,
      borderColor: color.border,
      borderRadius: radius.xl,
    },
    avatarWrap: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: color.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitial: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.headingLg,
      color: color.accent,
    },
    profileCopy: {
      flex: 1,
      alignItems: 'center',
      marginTop: spacing.lg,
    },
    name: {
      ...textShadow,
      fontFamily: fontFamily.bold,
      fontSize: fontSize.heading,
      color: color.textPrimary,
    },
    email: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.body,
      color: color.textSecondary,
      marginTop: spacing.xs,
    },
    company: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.body,
      color: color.textMuted,
      marginTop: spacing.sm,
    },
    preferenceGroup: {
      marginBottom: spacing.lg,
    },
    preferenceLabel: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.caption,
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
      borderRadius: radius.xl,
      overflow: 'hidden',
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
      borderRadius: radius.xl,
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
