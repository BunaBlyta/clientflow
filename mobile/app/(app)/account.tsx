import { Check, LogOut } from 'lucide-react-native';
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
        {(['system', 'light', 'dark'] as ThemeMode[]).map((option) => (
          <PreferenceOption
            key={option}
            label={t(`account.${option}` as 'account.system' | 'account.light' | 'account.dark')}
            selected={mode === option}
            onPress={() => setMode(option)}
            styles={styles}
          />
        ))}
      </PreferenceGroup>

      <PreferenceGroup label={t('account.language')}>
        <PreferenceOption label={t('account.english')} selected={language === 'en'} onPress={() => setLanguage('en')} styles={styles} />
        <PreferenceOption label={t('account.albanian')} selected={language === 'sq'} onPress={() => setLanguage('sq')} styles={styles} />
        <PreferenceOption label={t('account.german')} selected={language === 'de'} onPress={() => setLanguage('de')} styles={styles} />
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

function PreferenceOption({
  label,
  selected,
  onPress,
  styles,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  const { color } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.preferenceOption, selected && styles.preferenceOptionSelected]}
    >
      <Text style={[styles.preferenceOptionText, selected && styles.preferenceOptionTextSelected]}>
        {label}
      </Text>
      {selected && <Check size={16} color={color.accentText} strokeWidth={2.5} />}
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
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: color.border,
      borderRadius: 8,
      paddingHorizontal: spacing.md,
      overflow: 'hidden',
      marginBottom: spacing.xl,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: color.border,
    },
    infoRowLast: {
      borderBottomWidth: 0,
    },
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
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: color.border,
      borderRadius: 8,
    },
    preferenceOption: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 42,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: color.border,
      justifyContent: 'center',
      paddingHorizontal: spacing.md,
    },
    preferenceOptionSelected: {
      backgroundColor: 'transparent',
    },
    preferenceOptionText: {
      flex: 1,
      fontFamily: fontFamily.medium,
      fontSize: fontSize.meta,
      color: color.textMuted,
    },
    preferenceOptionTextSelected: {
      color: color.accentText,
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
