import { useLocalSearchParams, useRouter } from 'expo-router';
import { KeyRound } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { ApiError, setPasswordRequest } from '../../lib/api';
import { fontFamily, fontSize, radius, spacing, textShadow, useTheme } from '../../lib/theme';
import { useI18n } from '../../lib/i18n';
import { useAuthStore } from '../../store/auth-store';
import { AppBackButton } from '../../components/OriginBackButton';
import { AtmosphereBackground } from '../../components/ui/AtmosphereBackground';
import { isValidEmail } from '../../lib/validation';

export default function SetPasswordScreen() {
  const router = useRouter();
  const { color } = useTheme();
  const { t } = useI18n();
  const styles = createStyles(color);
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: string; email?: string; code?: string }>();
  const mode = params.mode === 'reset' ? 'reset' : 'invite';
  const startSession = useAuthStore((s) => s.startSession);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError('');
    if (password.length < 8) {
      setError(t('auth.passwordMin'));
      return;
    }
    if (password !== confirm) {
      setError(t('auth.passwordMismatch'));
      return;
    }
    const email = params.email?.trim().toLowerCase() ?? '';
    const code = params.code?.trim();
    if (!isValidEmail(email)) {
      setError(t('auth.validEmail'));
      return;
    }
    if (!code) {
      setError(t('auth.missingCode'));
      return;
    }
    setLoading(true);
    try {
      const response = await setPasswordRequest(email, code, password);
      await startSession(response);
      router.replace('/projects');
    } catch (caught) {
      setError(
        caught instanceof ApiError && caught.status === 400
          ? t('auth.invalidCode')
          : t('auth.setPasswordFailed')
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.lg },
      ]}
    >
      <AtmosphereBackground />
      <AppBackButton accessibilityLabel={t('common.back')} />
      <View style={styles.iconWrap}>
        <KeyRound size={22} color={color.accent} />
      </View>

      <Text style={styles.heading}>
        {mode === 'invite' ? t('auth.setPassword') : t('auth.chooseNewPassword')}
      </Text>
      <Text style={styles.subheading}>
        {params.email ? `${t('auth.forEmail', { email: params.email })} ` : ''}{t('auth.passwordMinimum')}
      </Text>

      <TextField
        label={t('auth.newPassword')}
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
        secureTextEntry
      />
      <TextField
        label={t('auth.confirmPassword')}
        value={confirm}
        onChangeText={setConfirm}
        placeholder="••••••••"
        secureTextEntry
        error={error || undefined}
      />

      <Button
        label={mode === 'invite' ? t('auth.setPasswordButton') : t('auth.updatePassword')}
        onPress={handleSubmit}
        loading={loading}
      />
    </View>
  );
}

function createStyles(color: ReturnType<typeof useTheme>['color']) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.background,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: color.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  heading: {
    ...textShadow,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.headingLg,
    color: color.textPrimary,
  },
  subheading: {
    ...textShadow,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.body,
    color: color.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  });
}
