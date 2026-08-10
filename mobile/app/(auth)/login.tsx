import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle2, LayoutGrid } from 'lucide-react-native';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { DEMO_PASSWORD, MOCK_CLIENT } from '../../lib/mock-data';
import { color, fontFamily, fontSize, radius, spacing } from '../../lib/theme';
import { useAuthStore } from '../../store/auth-store';

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ banner?: string }>();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState(MOCK_CLIENT.email);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleLogin() {
    setError('');
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const ok = login(email, password);
      setLoading(false);
      if (!ok) {
        setError('Invalid email or password.');
      }
    }, 400);
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <View style={styles.brandRow}>
          <View style={styles.logoMark}>
            <LayoutGrid size={20} color={color.textOnAccent} />
          </View>
          <Text style={styles.brand}>Clientflow</Text>
        </View>

        <Text style={styles.heading}>Welcome back</Text>
        <Text style={styles.subheading}>
          Log in to check your project status, notes, and invoices.
        </Text>

        {params.banner ? (
          <View style={styles.banner}>
            <CheckCircle2 size={16} color={color.success} />
            <Text style={styles.bannerText}>{params.banner}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@company.com"
            keyboardType="email-address"
            autoComplete="email"
          />
          <TextField
            label="Password"
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
            <Text style={styles.forgotLinkText}>Forgot password?</Text>
          </Pressable>

          <Button label="Log in" onPress={handleLogin} loading={loading} />

          <Text style={styles.demoHint}>
            Demo credentials are pre-filled — password is “{DEMO_PASSWORD}”.
          </Text>
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <Button
          label="I have an invite code"
          variant="secondary"
          onPress={() => router.push('/(auth)/verify-code?mode=invite')}
        />

        <Pressable
          onPress={() => router.push('/(auth)/request-status')}
          style={styles.statusLink}
        >
          <Text style={styles.statusLinkText}>
            Submitted a request already? Check its status
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: color.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sectionTitle,
    color: color.textPrimary,
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
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: color.successBg,
    borderWidth: 1,
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
    color: color.accent,
  },
  demoHint: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.meta,
    color: color.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: color.border,
  },
  dividerText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.meta,
    color: color.textMuted,
  },
  statusLink: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  statusLinkText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.caption,
    color: color.accent,
  },
});
