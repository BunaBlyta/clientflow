import { useLocalSearchParams } from 'expo-router';
import { KeyRound } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppBackButton, useOriginBack } from '../../../components/OriginBackButton';
import { Button } from '../../../components/ui/Button';
import { Screen } from '../../../components/ui/Screen';
import { TextField } from '../../../components/ui/TextField';
import { ApiError, changePasswordRequest } from '../../../lib/api';
import { useI18n } from '../../../lib/i18n';
import { fontFamily, fontSize, spacing, useTheme } from '../../../lib/theme';
import { useAuthStore } from '../../../store/auth-store';

const MIN_PASSWORD_LENGTH = 8;

export default function ChangePasswordScreen() {
  const { source } = useLocalSearchParams<{ source?: string }>();
  const { color } = useTheme();
  const { t } = useI18n();
  const styles = createStyles(color);
  const { goBack } = useOriginBack(source);
  const token = useAuthStore((s) => s.token);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!token) return;
    setError('');

    if (next.length < MIN_PASSWORD_LENGTH) {
      setError(t('auth.passwordMin'));
      return;
    }
    if (next !== confirm) {
      setError(t('auth.passwordMismatch'));
      return;
    }
    if (next === current) {
      setError(t('account.samePassword'));
      return;
    }

    setSaving(true);
    try {
      await changePasswordRequest(current, next, token);
      goBack();
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 400) {
        setError(
          /current password/i.test(caught.message)
            ? t('account.currentPasswordWrong')
            : caught.message || t('account.passwordChangeFailed'),
        );
      } else {
        setError(t('account.passwordChangeFailed'));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <AppBackButton source={source} accessibilityLabel={t('common.back')} />
      <View style={styles.titleRow}>
        <View style={styles.iconWrap}>
          <KeyRound size={16} color={color.textSecondary} strokeWidth={1.8} />
        </View>
        <Text style={styles.title}>{t('account.changePassword')}</Text>
      </View>
      <Text style={styles.subtitle}>{t('account.changePasswordSubtitle')}</Text>

      <View style={styles.form}>
        <TextField
          label={t('account.currentPassword')}
          value={current}
          onChangeText={setCurrent}
          placeholder="••••••••"
          secureTextEntry
        />
        <TextField
          label={t('auth.newPassword')}
          value={next}
          onChangeText={setNext}
          placeholder="••••••••"
          secureTextEntry
          helperText={t('auth.passwordMinimum')}
        />
        <TextField
          label={t('auth.confirmPassword')}
          value={confirm}
          onChangeText={setConfirm}
          placeholder="••••••••"
          secureTextEntry
          error={error || undefined}
        />
        <Button label={t('auth.updatePassword')} onPress={handleSave} loading={saving} />
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
  });
}
