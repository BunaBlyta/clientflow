import { useRouter } from 'expo-router';
import { ArrowLeft, Send } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { ApiError, verificationSendRequest } from '../../lib/api';
import { color, fontFamily, fontSize, radius, spacing } from '../../lib/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    setError('');
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await verificationSendRequest(normalizedEmail);
      router.push(
        `/(auth)/verify-code?mode=reset&email=${encodeURIComponent(normalizedEmail)}`
      );
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Unable to send a reset code. Please try again.'
      );
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
        <Send size={20} color={color.accent} />
      </View>

      <Text style={styles.heading}>Reset your password</Text>
      <Text style={styles.subheading}>
        Enter the email on your account and we'll send you a code to reset your
        password.
      </Text>

      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@company.com"
        keyboardType="email-address"
        autoComplete="email"
        error={error || undefined}
      />

      <Button label="Send reset code" onPress={handleSend} loading={loading} />
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
});
