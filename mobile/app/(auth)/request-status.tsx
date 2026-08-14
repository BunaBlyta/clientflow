import { Clock3, ShieldCheck, ShieldX } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { getPackageById, MOCK_REQUESTS } from '../../lib/mock-data';
import { getRequestStatusMeta } from '../../lib/status';
import { fontFamily, fontSize, radius, spacing, useTheme } from '../../lib/theme';
import { useI18n } from '../../lib/i18n';
import type { ProjectRequest } from '../../lib/types';

export default function RequestStatusScreen() {
  const { color } = useTheme();
  const { t } = useI18n();
  const styles = createStyles(color);
  const insets = useSafeAreaInsets();
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

  const meta = result ? getRequestStatusMeta(result.status, color, t) : null;
  const pkg = result ? getPackageById(result.packageId) : null;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + spacing.lg }]}>
      <Text style={styles.heading}>{t('auth.checkYourRequest')}</Text>
      <Text style={styles.subheading}>
        {t('auth.requestSubheading')}
      </Text>

      <TextField
        label={t('auth.email')}
        value={email}
        onChangeText={(t) => {
          setEmail(t);
          setSearched(false);
        }}
        placeholder={t('auth.emailPlaceholder')}
        keyboardType="email-address"
        autoComplete="email"
        helperText={t('auth.demoEmails')}
      />

      <Button label={t('auth.checkStatus')} onPress={handleCheck} disabled={!email.trim()} />

      {searched && !result && (
        <View style={[styles.resultCard, styles.notFound]}>
          <Text style={styles.notFoundText}>
            {t('auth.noRequestDetails')}
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
            {result.status === 'PENDING' && t('auth.pendingRequest')}
            {result.status === 'APPROVED' && t('auth.approvedRequest')}
            {result.status === 'REJECTED' && t('auth.rejectedRequest')}
          </Text>
        </View>
      )}
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
    borderWidth: StyleSheet.hairlineWidth,
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
}
