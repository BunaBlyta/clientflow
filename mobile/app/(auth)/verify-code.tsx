import { useLocalSearchParams, useRouter } from 'expo-router';
import { MailCheck } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { verificationCheckRequest, verificationSendRequest } from '../../lib/api';
import { fontFamily, fontSize, radius, spacing, useTheme } from '../../lib/theme';
import { useI18n } from '../../lib/i18n';

export default function VerifyCodeScreen() {
  const router = useRouter();
  const { color } = useTheme();
  const { t } = useI18n();
  const styles = createStyles(color);
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: string; email?: string }>();
  const mode = params.mode === 'reset' ? 'reset' : 'invite';

  const [email, setEmail] = useState(params.email ?? '');
  const [code, setCode] = useState('');
  const [error, setError] = useState<'invalid' | 'expired' | ''>('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function startCooldown() {
    setCooldown(30);
    timerRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  async function handleContinue() {
    setError('');
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = code.trim();
    if (!normalizedEmail) {
      setError('invalid');
      return;
    }
    if (normalizedCode.length !== 6) {
      setError('invalid');
      return;
    }
    setLoading(true);
    try {
      await verificationCheckRequest(normalizedEmail, normalizedCode);
      router.push(
        `/(auth)/set-password?mode=${mode}&email=${encodeURIComponent(normalizedEmail)}&code=${encodeURIComponent(normalizedCode)}`
      );
    } catch {
      setError('invalid');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError('invalid');
      return;
    }
    setCode('');
    setError('');
    setLoading(true);
    try {
      await verificationSendRequest(normalizedEmail);
      startCooldown();
    } catch {
      setError('invalid');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + spacing.lg }]}>
      <View style={styles.iconWrap}>
        <MailCheck size={22} color={color.accent} />
      </View>

      <Text style={styles.heading}>
        {mode === 'invite' ? t('auth.verifyEmail') : t('auth.enterResetCode')}
      </Text>
      <Text style={styles.subheading}>
        {mode === 'invite'
          ? t('auth.inviteCodeSubheading')
          : t('auth.resetCodeSubheading')}
      </Text>

      <TextField
        label={t('auth.email')}
        value={email}
        onChangeText={setEmail}
        placeholder={t('auth.emailPlaceholder')}
        keyboardType="email-address"
        autoComplete="email"
      />

      <TextField
        label={t('auth.verificationCode')}
        value={code}
        onChangeText={(t) => setCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
        placeholder="123456"
        keyboardType="number-pad"
        maxLength={6}
        helperText={!error ? t('auth.codeHelper') : undefined}
        error={
          error === 'invalid'
            ? t('auth.invalidCode')
            : error === 'expired'
              ? t('auth.expiredCode')
              : undefined
        }
      />

      <Button label={t('auth.continue')} onPress={handleContinue} loading={loading} />

      <Pressable
        onPress={handleResend}
        disabled={cooldown > 0 || loading}
        style={styles.resendLink}
      >
        <Text
          style={[
            styles.resendText,
            cooldown > 0 && styles.resendTextDisabled,
          ]}
        >
          {cooldown > 0 ? `${t('auth.resend')} (${cooldown}s)` : t('auth.resend')}
        </Text>
      </Pressable>
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
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.headingLg,
    color: color.textPrimary,
  },
  subheading: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.body,
    color: color.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  resendLink: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  resendText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.caption,
    color: color.accent,
  },
  resendTextDisabled: {
    color: color.textMuted,
  },
  });
}
