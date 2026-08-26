import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle2, ChevronRight, Layers3 } from 'lucide-react-native';
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { MOCK_CLIENT } from '../../lib/mock-data';
import { ApiError } from '../../lib/api';
import { fontFamily, fontSize, radius, spacing, textShadow, useTheme } from '../../lib/theme';
import { useI18n } from '../../lib/i18n';
import { useAuthStore } from '../../store/auth-store';
import { AtmosphereBackground } from '../../components/ui/AtmosphereBackground';

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ banner?: string }>();
  const { color, mode } = useTheme();
  const { t } = useI18n();
  const styles = createStyles(color);
  const insets = useSafeAreaInsets();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState(MOCK_CLIENT.email);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError('');
    if (!email.trim() || !password) {
      setError(t('auth.emailPasswordRequired'));
      return;
    }
    setLoading(true);
    try {
      const ok = await login(email, password);
      if (!ok) setError(t('auth.invalidCredentials'));
    } catch (caughtError) {
      // Keep invalid credentials localized, but surface transport/server errors
      // during development so a broken API origin is distinguishable from a
      // rejected password on a physical iOS device.
      if (caughtError instanceof ApiError && caughtError.status === 401) {
        setError(t('auth.invalidCredentials'));
      } else {
        if (__DEV__ && caughtError instanceof Error) {
          console.warn('[Clientflow] login request failed:', caughtError.message);
        }
        setError(t('common.error'));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg }]}>
        <AtmosphereBackground />
        <View style={styles.brandRow}>
          <View style={styles.logoMark}>
            {mode === 'light' ? (
              <Image source={require('../../assets/clientflow-logo-green.png')} style={styles.logoImage} />
            ) : (
              <Layers3 size={19} color={color.accentText} strokeWidth={1.8} />
            )}
          </View>
          <Text style={styles.brand}>{t('auth.brand')}</Text>
        </View>

        <Text style={styles.heading}>{t('auth.welcome')}</Text>
        <Text style={styles.subheading}>
          {t('auth.loginSubheading')}
        </Text>

        {params.banner ? (
          <View style={styles.banner}>
            <CheckCircle2 size={16} color={color.success} />
            <Text style={styles.bannerText}>{params.banner}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <TextField
            label={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            placeholder={t('auth.emailPlaceholder')}
            keyboardType="email-address"
            autoComplete="email"
          />
          <TextField
            label={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoComplete="password"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            onPress={() => router.push('/(auth)/forgot-password')}
            style={styles.forgotLink}
          >
          <Text style={styles.forgotLinkText}>{t('auth.forgotPassword')}</Text>
          </Pressable>

          <Button label={t('auth.logIn')} onPress={handleLogin} loading={loading} />

          <Text style={styles.demoHint}>
            {t('auth.demoHint')}
          </Text>
        </View>

        <Pressable
          onPress={() => router.push('/(auth)/verify-code?mode=invite')}
          style={({ pressed }) => [styles.inviteLink, pressed && styles.pressed]}
        >
          <Text style={styles.inviteLinkText}>{t('auth.inviteCode')}</Text>
          <ChevronRight size={16} color={color.accent} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function createStyles(color: ReturnType<typeof useTheme>['color']) {
  return StyleSheet.create({
  flex: { flex: 1, backgroundColor: color.background },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  logoMark: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: color.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
  },
  brand: {
    fontFamily: fontFamily.serif,
    fontSize: fontSize.sectionTitle,
    color: color.textPrimary,
    ...textShadow,
  },
  heading: {
    ...textShadow,
    fontFamily: fontFamily.serif,
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
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: color.successBg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.successBorder,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  bannerText: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.caption,
    color: color.success,
  },
  form: {
    marginBottom: spacing.lg,
  },
  error: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.caption,
    color: color.danger,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
  },
  forgotLinkText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.caption,
    color: color.accentText,
  },
  demoHint: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.meta,
    color: color.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  inviteLink: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  inviteLinkText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.caption,
    color: color.accentText,
  },
  pressed: {
    opacity: 0.7,
  },
  });
}
