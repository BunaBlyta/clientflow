import { ChevronRight, KeyRound, SquarePen } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppBackButton, useOriginBack } from '../../../components/OriginBackButton';
import { Button } from '../../../components/ui/Button';
import { Screen } from '../../../components/ui/Screen';
import { TextField } from '../../../components/ui/TextField';
import { ApiError, updateProfileRequest, type ProfileUpdateInput } from '../../../lib/api';
import { useI18n } from '../../../lib/i18n';
import { fontFamily, fontSize, radius, spacing, useTheme } from '../../../lib/theme';
import { useSingleFire } from '../../../lib/use-single-fire';
import { useAuthStore } from '../../../store/auth-store';

// Requires a leading "+" so the number always carries its country code —
// a bare national number is ambiguous without knowing which country it's
// local to.
const PHONE_CHARS = /^\+[0-9\s().-]+$/;

function isValidPhone(value: string) {
  if (!PHONE_CHARS.test(value)) return false;
  // 10-15 digits (country code + subscriber number) matches E.164's max
  // length and rules out anything too short to be a real number.
  const digitCount = value.replace(/\D/g, '').length;
  return digitCount >= 10 && digitCount <= 15;
}

export default function EditProfileScreen() {
  const { color } = useTheme();
  const { t } = useI18n();
  const styles = createStyles(color);
  // This screen lives in the Account stack, so a plain pop returns to the
  // Account list — no origin routing needed.
  const { goBack } = useOriginBack();
  const router = useRouter();
  const openChangePassword = useSingleFire(() => router.push('/account/change-password'));

  const client = useAuthStore((s) => s.client);
  const token = useAuthStore((s) => s.token);
  const updateClient = useAuthStore((s) => s.updateClient);

  const [name, setName] = useState(client?.name ?? '');
  const [companyName, setCompanyName] = useState(client?.companyName ?? '');
  const [phone, setPhone] = useState(client?.phone ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!token) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(t('account.nameRequired'));
      return;
    }
    const trimmedPhone = phone.trim();
    if (trimmedPhone && !isValidPhone(trimmedPhone)) {
      setError(t('account.invalidPhone'));
      return;
    }

    // Only send the fields that actually changed.
    const changes: ProfileUpdateInput = {};
    if (trimmedName !== (client?.name ?? '')) changes.name = trimmedName;
    if (companyName.trim() !== (client?.companyName ?? '')) changes.companyName = companyName.trim();
    if (trimmedPhone !== (client?.phone ?? '')) changes.phone = trimmedPhone;

    if (Object.keys(changes).length === 0) {
      goBack();
      return;
    }

    setError('');
    setSaving(true);
    try {
      const updated = await updateProfileRequest(changes, token);
      await updateClient({
        name: updated.name,
        companyName: updated.companyName ?? undefined,
        phone: updated.phone ?? undefined,
      });
      goBack();
    } catch (caught) {
      setError(
        caught instanceof ApiError && caught.status === 400 && caught.message
          ? caught.message
          : t('account.profileSaveFailed'),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <AppBackButton accessibilityLabel={t('common.back')} />
      <View style={styles.titleRow}>
        <View style={styles.iconWrap}>
          <SquarePen size={16} color={color.textSecondary} strokeWidth={1.8} />
        </View>
        <Text style={styles.title}>{t('account.editProfile')}</Text>
      </View>
      <Text style={styles.subtitle}>{t('account.editProfileSubtitle')}</Text>

      <View style={styles.form}>
        <TextField
          label={t('account.name')}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          maxLength={120}
        />
        <TextField
          label={t('account.companyOptional')}
          value={companyName}
          onChangeText={setCompanyName}
          autoCapitalize="words"
          maxLength={120}
        />
        <TextField
          label={t('account.phoneOptional')}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="+1 555 123 4567"
          maxLength={40}
        />
        <TextField
          label={t('account.email')}
          value={client?.email ?? ''}
          onChangeText={() => {}}
          editable={false}
          helperText={t('account.emailLockedHint')}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label={t('common.save')} onPress={handleSave} loading={saving} />
      </View>

      <View style={styles.securitySection}>
        <Text style={styles.sectionLabel}>{t('account.security')}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={openChangePassword}
          style={({ pressed }) => [styles.passwordRow, pressed && styles.pressed]}
        >
          <View style={styles.passwordLeading}>
            <KeyRound size={17} color={color.textSecondary} strokeWidth={1.8} />
            <Text style={styles.passwordLabel}>{t('account.changePassword')}</Text>
          </View>
          <ChevronRight size={16} color={color.textMuted} strokeWidth={1.8} />
        </Pressable>
      </View>
    </Screen>
  );
}

function createStyles(color: ReturnType<typeof useTheme>['color']) {
  return StyleSheet.create({
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    iconWrap: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: color.surfaceMuted,
    },
    title: {
      fontFamily: fontFamily.serif,
      fontSize: fontSize.headingLg,
      color: color.textPrimary,
    },
    subtitle: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.body,
      lineHeight: 21,
      color: color.textSecondary,
      marginTop: spacing.sm,
    },
    form: {
      marginTop: spacing.xl,
    },
    error: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.meta,
      color: color.danger,
      marginBottom: spacing.lg,
    },
    securitySection: {
      marginTop: spacing.xl,
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
    passwordRow: {
      minHeight: 56,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      backgroundColor: color.surface,
      borderRadius: radius.lg,
    },
    passwordLeading: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    passwordLabel: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.body,
      color: color.textPrimary,
    },
    pressed: {
      opacity: 0.72,
    },
  });
}
