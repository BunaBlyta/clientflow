import { Clock3, ShieldCheck, ShieldX } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { getPackageById, MOCK_REQUESTS } from '../../lib/mock-data';
import { getRequestStatusMeta } from '../../lib/status';
import { fontFamily, fontSize, spacing, textShadow, useTheme } from '../../lib/theme';
import { Card } from '../../components/ui/Card';
import { useI18n } from '../../lib/i18n';
import type { ProjectRequest } from '../../lib/types';
import { AppBackButton } from '../../components/OriginBackButton';
import { AtmosphereBackground } from '../../components/ui/AtmosphereBackground';

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
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.lg },
      ]}
    >
      <AtmosphereBackground />
      <AppBackButton accessibilityLabel={t('common.back')} />
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
        <Card tone="muted" style={styles.resultCard}>
          <Text style={styles.notFoundText}>
            {t('auth.noRequestDetails')}
          </Text>
        </Card>
      )}

      {searched && result && meta && (
        <Card style={styles.resultCard}>
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
        </Card>
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
  resultCard: {
    marginTop: spacing.xl,
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
  notFoundText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.caption,
    color: color.textSecondary,
    lineHeight: 19,
  },
  });
}
