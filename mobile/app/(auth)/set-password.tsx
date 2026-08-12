import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, KeyRound } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { ApiError, setPasswordRequest } from '../../lib/api';
import { color, fontFamily, fontSize, radius, spacing } from '../../lib/theme';
import { useAuthStore } from '../../store/auth-store';

export default function SetPasswordScreen() {
  const router = useRouter();
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
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    const email = params.email?.trim().toLowerCase();
    const code = params.code?.trim();
    if (!email || !code) {
      setError('This password link is missing its verification code. Start again.');
      return;
    }
    setLoading(true);
    try {
      const response = await setPasswordRequest(email, code, password);
      await startSession(response);
      router.replace('/projects');
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Unable to set your password. Please try again.'
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
        <KeyRound size={22} color={color.accent} />
      </View>

      <Text style={styles.heading}>
        {mode === 'invite' ? 'Set your password' : 'Choose a new password'}
      </Text>
      <Text style={styles.subheading}>
        {params.email ? `For ${params.email}. ` : ''}Use at least 8 characters.
      </Text>

      <TextField
        label="New password"
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
        secureTextEntry
      />
      <TextField
        label="Confirm password"
        value={confirm}
        onChangeText={setConfirm}
        placeholder="••••••••"
        secureTextEntry
        error={error || undefined}
      />

      <Button
        label={mode === 'invite' ? 'Set password' : 'Update password'}
        onPress={handleSubmit}
        loading={loading}
      />
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
