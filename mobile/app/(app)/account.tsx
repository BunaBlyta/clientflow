import { Building2, LogOut, Mail, User as UserIcon } from 'lucide-react-native';
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
      logout();
      return;
    }
    setConfirmingLogout(true);
  }

  return (
    <Screen
      contentContainerStyle={{
        paddingBottom: 64 + insets.bottom + spacing.md,
      }}
    >
      <Text style={styles.heading}>{t('account.title')}</Text>

      <View style={styles.avatarWrap}>
        <Text style={styles.avatarInitial}>
          {client?.name?.charAt(0).toUpperCase() ?? '?'}
        </Text>
      </View>
      <Text style={styles.name}>{client?.name}</Text>
      <Text style={styles.company}>{client?.companyName}</Text>

      <View style={styles.infoBlock}>
        <InfoRow icon={Mail} label={t('account.email')} value={client?.email ?? ''} />
        <InfoRow icon={Building2} label={t('account.company')} value={client?.companyName ?? ''} />
        <InfoRow icon={UserIcon} label={t('account.contact')} value={client?.name ?? ''} />
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
        <View style={styles.confirmBlock}>
          <View style={styles.confirmActions}>
            <Pressable
              onPress={() => setConfirmingLogout(false)}
              style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
            >
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [
                styles.logoutButton,
                styles.confirmLogoutButton,
                pressed && styles.pressed,
              ]}
            >
              <LogOut size={16} color={color.danger} />
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
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  const { color } = useTheme();
  const styles = createStyles(color);
  return (
    <View style={styles.infoRow}>
      <Icon size={16} color={color.textMuted} />
      <View style={styles.infoTextCol}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
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

function PreferenceOption({ label, selected, onPress, styles }: { label: string; selected: boolean; onPress: () => void; styles: ReturnType<typeof createStyles> }) {
  return (
    <Pressable onPress={onPress} style={[styles.preferenceOption, selected && styles.preferenceOptionSelected]}>
      <Text style={[styles.preferenceOptionText, selected && styles.preferenceOptionTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function createStyles(color: ReturnType<typeof useTheme>['color']) {
  return StyleSheet.create({
  heading: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.headingLg,
    color: color.textPrimary,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: color.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarInitial: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.heading,
    color: color.accentPressed,
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
    marginBottom: spacing.xl,
  },
  infoBlock: {
    borderTopWidth: 1,
    borderTopColor: color.border,
    marginBottom: spacing.xl,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
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
    marginTop: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: color.dangerBg,
    shadowColor: color.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  confirmLogoutButton: {
    flex: 1,
  },
  confirmBlock: {
    gap: spacing.md,
  },
  confirmText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.body,
    color: color.textPrimary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'stretch',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    height: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: color.surfaceMuted,
    shadowColor: color.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.body,
    color: color.textSecondary,
  },
  pressed: {
    opacity: 0.7,
  },
  logoutText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.body,
    color: color.danger,
  },
  footer: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.meta,
    color: color.textMuted,
    textAlign: 'center',
    marginTop: spacing.xxl + spacing.md,
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
    flexDirection: 'row',
    gap: spacing.sm,
  },
  preferenceOption: {
    flex: 1,
    minHeight: 40,
    borderRadius: radius.sm,
    backgroundColor: color.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  preferenceOptionSelected: {
    backgroundColor: color.accentSoft,
    shadowColor: color.accent,
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  preferenceOptionText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.meta,
    color: color.textSecondary,
  },
  preferenceOptionTextSelected: {
    color: color.accentPressed,
  },
  });
}
