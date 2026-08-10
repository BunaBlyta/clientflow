import { useRouter } from 'expo-router';
import { ArrowLeft, Clock3, ShieldCheck, ShieldX } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { getPackageById, MOCK_REQUESTS } from '../../lib/mock-data';
import { REQUEST_STATUS_META } from '../../lib/status';
import { color, fontFamily, fontSize, radius, spacing } from '../../lib/theme';
import type { ProjectRequest } from '../../lib/types';

export default function RequestStatusScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [searched, setSearched] = useState(false);
  const [result, setResult] = useState<ProjectRequest | null>(null);

  function handleCheck() {
    const found = MOCK_REQUESTS.find(
      (r) => r.prospectEmail.toLowerCase() === email.trim().toLowerCase()
    );
    setResult(found ?? null);
    setSearched(true);
  }

  const meta = result ? REQUEST_STATUS_META[result.status] : null;
  const pkg = result ? getPackageById(result.packageId) : null;

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
        <ArrowLeft size={20} color={color.textPrimary} />
      </Pressable>

      <Text style={styles.heading}>Check your request</Text>
      <Text style={styles.subheading}>
        Enter the email you used when you submitted your project request on our
        website.
      </Text>

      <TextField
        label="Email"
        value={email}
        onChangeText={(t) => {
          setEmail(t);
          setSearched(false);
        }}
        placeholder="you@company.com"
        keyboardType="email-address"
        autoComplete="email"
        helperText="Demo emails: dana@brightlaunch.io, marcus@webbstudio.com, priya@shahconsulting.com"
      />

      <Button label="Check status" onPress={handleCheck} disabled={!email.trim()} />

      {searched && !result && (
        <View style={[styles.resultCard, styles.notFound]}>
          <Text style={styles.notFoundText}>
            We couldn't find a request for that email. Double-check for typos,
            or submit a new request from our website.
          </Text>
        </View>
      )}

      {searched && result && meta && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            {result.status === 'PENDING' && <Clock3 size={20} color={meta.text} />}
            {result.status === 'APPROVED' && <ShieldCheck size={20} color={meta.text} />}
            {result.status === 'REJECTED' && <ShieldX size={20} color={meta.text} />}
            <Text style={[styles.resultStatus, { color: meta.text }]}>
              {meta.label}
            </Text>
          </View>
          <Text style={styles.resultName}>{result.prospectName}</Text>
          {pkg && <Text style={styles.resultMeta}>{pkg.name}</Text>}
          <Text style={styles.resultCopy}>
            {result.status === 'PENDING' &&
              "We're reviewing your request and will be in touch soon. No action needed yet."}
            {result.status === 'APPROVED' &&
              'Your request was approved! Check your email for an invite link to set up your account and pay your deposit.'}
            {result.status === 'REJECTED' &&
              "We aren't able to move forward with this request right now. We've sent details to your email."}
          </Text>
        </View>
      )}
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
  resultCard: {
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  resultStatus: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.body,
  },
  resultName: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.cardTitle,
    color: color.textPrimary,
  },
  resultMeta: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.caption,
    color: color.textMuted,
    marginTop: 2,
  },
  resultCopy: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.caption,
    color: color.textSecondary,
    marginTop: spacing.md,
    lineHeight: 19,
  },
  notFound: {
    backgroundColor: color.neutralBg,
    borderColor: color.neutralBorder,
  },
  notFoundText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.caption,
    color: color.textSecondary,
    lineHeight: 19,
  },
});
