import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { AppState, type AppStateStatus } from 'react-native';
import { CheckCircle2, Lock, XCircle } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '../../../../../../components/ui/Button';
import { Screen } from '../../../../../../components/ui/Screen';
import { formatCurrency } from '../../../../../../lib/format';
import { fontFamily, fontSize, radius, spacing, useTheme } from '../../../../../../lib/theme';
import { useI18n } from '../../../../../../lib/i18n';
import { useDataStore } from '../../../../../../store/data-store';
import { useAuthStore } from '../../../../../../store/auth-store';
import { ApiError, checkoutRequest } from '../../../../../../lib/api';

type Step = 'select' | 'processing' | 'success' | 'failed';

export default function CheckoutScreen() {
  const { id, invoiceId } = useLocalSearchParams<{ id: string; invoiceId: string }>();
  const router = useRouter();
  const { color } = useTheme();
  const { t } = useI18n();
  const styles = createStyles(color);
  const invoice = useDataStore((s) => s.invoiceById(invoiceId));
  const token = useAuthStore((s) => s.token);
  const refreshInvoice = useDataStore((s) => s.refreshInvoice);

  const [step, setStep] = useState<Step>('select');
  const [message, setMessage] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  async function refreshAfterReturn() {
    if (!token || !invoiceId) return;
    setCheckingStatus(true);
    const live = await refreshInvoice(invoiceId, token);
    setCheckingStatus(false);
    const latest = useDataStore.getState().invoiceById(invoiceId);
    if (!live) {
      setMessage(t('checkout.couldNotCheck'));
    } else if (latest?.status === 'PAID') {
      setMessage(null);
      setStep('success');
    } else if (latest?.status === 'FAILED') {
      setMessage(t('checkout.notConfirmedRetry'));
      setStep('failed');
    } else {
      setMessage(t('checkout.noPayment'));
      setStep('select');
    }
  }

  async function handlePay() {
    if (!token) {
      setMessage(t('checkout.sessionExpired'));
      setStep('failed');
      return;
    }
    setStep('processing');
    setMessage(null);
    try {
      const response = await checkoutRequest(invoiceId, token);
      await Linking.openURL(response.checkoutUrl);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        await refreshAfterReturn();
        setMessage(t('checkout.alreadyPaid'));
      } else if (error instanceof ApiError && error.status === 503) {
        setMessage(t('checkout.unavailable'));
        setStep('failed');
      } else {
        setMessage(error instanceof Error ? error.message : t('checkout.unableToOpen'));
        setStep('failed');
      }
    }
  }

  useEffect(() => {
    let wasBackgrounded = false;
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState !== 'active') wasBackgrounded = true;
      if (nextState === 'active' && wasBackgrounded && step === 'processing') {
        wasBackgrounded = false;
        void refreshAfterReturn();
      }
    });
    return () => subscription.remove();
  }, [step, token, invoiceId]);

  if (!invoice) {
    return (
      <Screen>
        <Text style={styles.notFound}>{t('checkout.notFound')}</Text>
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={styles.content}>
      <View style={styles.disclaimer}>
        <Lock size={12} color={color.textMuted} />
        <Text style={styles.disclaimerText}>
          {t('checkout.secure')}
        </Text>
      </View>

      {step === 'select' && (
        <>
          <View style={styles.card}>
            <Text style={styles.merchant}>{t('checkout.merchant')}</Text>
            <Text style={styles.amount}>{formatCurrency(invoice.amountCents)}</Text>
            <Text style={styles.label}>{invoice.label}</Text>

          </View>

          <Button
            label={t('checkout.continue')}
            onPress={() => void handlePay()}
          />
        </>
      )}

      {step === 'processing' && (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={color.accent} />
          <Text style={styles.centerTitle}>{t('checkout.confirming')}</Text>
          <Text style={styles.centerSubtitle}>
            {t('checkout.confirmingSubheading')}
          </Text>
          <View style={{ height: spacing.lg }} />
          <Button label={checkingStatus ? t('checkout.checking') : t('checkout.returnedCheck')} onPress={() => void refreshAfterReturn()} loading={checkingStatus} />
        </View>
      )}

      {step === 'success' && (
        <View style={styles.centerState}>
          <CheckCircle2 size={40} color={color.success} />
          <Text style={styles.centerTitle}>{t('checkout.received')}</Text>
          <Text style={styles.centerSubtitle}>
            {t('checkout.receivedSubheading')}
          </Text>
          <View style={{ height: spacing.lg }} />
          <Button
            label={t('checkout.returnToInvoice')}
            onPress={() => router.replace(`/projects/${id}/invoices/${invoiceId}`)}
          />
        </View>
      )}

      {step === 'failed' && (
        <View style={styles.centerState}>
          <XCircle size={40} color={color.danger} />
          <Text style={styles.centerTitle}>{t('checkout.declined')}</Text>
          <Text style={styles.centerSubtitle}>
            {message || t('checkout.declinedSubheading')}
          </Text>
          <View style={{ height: spacing.lg }} />
          <Button label={t('common.retry')} onPress={() => setStep('select')} />
          <View style={{ height: spacing.sm }} />
          <Pressable onPress={() => router.replace(`/projects/${id}/invoices/${invoiceId}`)}>
            <Text style={styles.backLink}>{t('checkout.returnToInvoice')}</Text>
          </Pressable>
        </View>
      )}

      {message && step !== 'failed' && step !== 'success' && (
        <Text style={styles.message}>{message}</Text>
      )}
    </Screen>
  );
}

function createStyles(color: ReturnType<typeof useTheme>['color']) {
  return StyleSheet.create({
  content: {
    flexGrow: 1,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  disclaimerText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.meta,
    color: color.textMuted,
  },
  card: {
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  merchant: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.caption,
    color: color.textMuted,
  },
  amount: {
    fontFamily: fontFamily.semibold,
    fontSize: 30,
    color: color.textPrimary,
    marginTop: spacing.xs,
  },
  label: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.caption,
    color: color.textSecondary,
    marginBottom: spacing.lg,
  },
  fieldMock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 44,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: color.surfaceMuted,
    marginBottom: spacing.sm,
  },
  fieldMockText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.caption,
    color: color.textMuted,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  fieldHalf: {
    flex: 1,
  },
  sectionLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.caption,
    color: color.textSecondary,
    marginBottom: spacing.md,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  centerTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.heading,
    color: color.textPrimary,
    marginTop: spacing.lg,
  },
  centerSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.caption,
    color: color.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 19,
  },
  backLink: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.caption,
    color: color.accent,
    textAlign: 'center',
  },
  message: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.caption,
    color: color.warning,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  notFound: {
    color: color.textPrimary,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.body,
  },
  });
}
