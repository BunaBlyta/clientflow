import { useRouter } from 'expo-router';
import { Send } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { ApiError, verificationSendRequest } from '../../lib/api';
import { fontFamily, fontSize, radius, spacing, textShadow, useTheme } from '../../lib/theme';
import { useI18n } from '../../lib/i18n';
import { AppBackButton } from '../../components/OriginBackButton';
import { AtmosphereBackground } from '../../components/ui/AtmosphereBackground';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { color } = useTheme();
  const { t } = useI18n();
  const styles = createStyles(color);
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    setError('');
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      setError(t('auth.validEmail'));
      return;
    }
    setLoading(true);
    try {
      await verificationSendRequest(normalizedEmail);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : t('auth.sendResetFailed')
      );
      return;
    } finally {
      setLoading(false);
    }

    router.push({
      pathname: '/(auth)/verify-code',
      params: { mode: 'reset', email: normalizedEmail },
    });
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
        <Send size={20} color={color.accent} />
      </View>

      <Text style={styles.heading}>{t('auth.resetPassword')}</Text>
      <Text style={styles.subheading}>
        {t('auth.resetSubheading')}
      </Text>

      <TextField
        label={t('auth.email')}
        value={email}
        onChangeText={setEmail}
        placeholder={t('auth.emailPlaceholder')}
        keyboardType="email-address"
        autoComplete="email"
        error={error || undefined}
      />

      <Button label={t('auth.sendCode')} onPress={handleSend} loading={loading} />
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
