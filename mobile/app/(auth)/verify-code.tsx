import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, MailCheck } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { verificationCheckRequest, verificationSendRequest } from '../../lib/api';
import { color, fontFamily, fontSize, radius, spacing } from '../../lib/theme';

export default function VerifyCodeScreen() {
  const router = useRouter();
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
    <View style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
        <ArrowLeft size={20} color={color.textPrimary} />
      </Pressable>

      <View style={styles.iconWrap}>
        <MailCheck size={22} color={color.accent} />
      </View>

      <Text style={styles.heading}>
        {mode === 'invite' ? 'Verify your email' : 'Enter your reset code'}
      </Text>
      <Text style={styles.subheading}>
        {mode === 'invite'
          ? "We sent a 6-digit code to your email to activate your account."
          : "We sent a 6-digit code to your email to reset your password."}
      </Text>

      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@company.com"
        keyboardType="email-address"
        autoComplete="email"
      />

      <TextField
        label="Verification code"
        value={code}
        onChangeText={(t) => setCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
        placeholder="123456"
        keyboardType="number-pad"
        maxLength={6}
        helperText={!error ? 'Enter the 6-digit code from your email.' : undefined}
        error={
          error === 'invalid'
            ? "That code isn't right. Check your email and try again."
            : error === 'expired'
              ? 'This code has expired. Request a new one below.'
              : undefined
        }
      />

      <Button label="Continue" onPress={handleContinue} loading={loading} />

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
          {cooldown > 0 ? `Resend code (${cooldown}s)` : 'Resend code'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.background,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    marginLeft: -spacing.sm,
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
