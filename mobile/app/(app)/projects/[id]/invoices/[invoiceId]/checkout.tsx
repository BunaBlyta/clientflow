import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import { CheckCircle2, Lock, XCircle } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
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

const PAYMENT_STATUS_ATTEMPTS = 8;
const PAYMENT_STATUS_DELAY_MS = 1500;

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
  const statusCheckInFlight = useRef(false);

  async function refreshAfterReturn() {
    if (!token || !invoiceId || statusCheckInFlight.current) return;
    statusCheckInFlight.current = true;
    setCheckingStatus(true);

    try {
      for (let attempt = 0; attempt < PAYMENT_STATUS_ATTEMPTS; attempt += 1) {
        const live = await refreshInvoice(invoiceId, token, true);
        const latest = useDataStore.getState().invoiceById(invoiceId);

        if (!live) {
          setMessage(t('checkout.couldNotCheck'));
          return;
        }

        if (latest?.status === 'PAID') {
          setMessage(null);
          setStep('success');
          return;
        }

        if (latest?.status === 'FAILED') {
          setMessage(t('checkout.notConfirmedRetry'));
          setStep('failed');
          return;
        }

        if (attempt < PAYMENT_STATUS_ATTEMPTS - 1) {
          await new Promise((resolve) => setTimeout(resolve, PAYMENT_STATUS_DELAY_MS));
        }
      }

      // Stripe redirects before the webhook necessarily reaches the API. Keep
      // the screen recoverable if the webhook is delayed. The user can retry
      // from here; the invoice remains protected by the server-side webhook
      // state transition.
      setMessage(t('checkout.notConfirmedRetry'));
      setStep('failed');
    } finally {
      statusCheckInFlight.current = false;
      setCheckingStatus(false);
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
    const handleReturn = () => {
      if (step === 'processing') void refreshAfterReturn();
    };
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState !== 'active') wasBackgrounded = true;
      if (nextState === 'active' && wasBackgrounded && step === 'processing') {
        wasBackgrounded = false;
        handleReturn();
      }
    });

    if (Platform.OS === 'web') window.addEventListener('focus', handleReturn);
    return () => {
      subscription.remove();
      if (Platform.OS === 'web') window.removeEventListener('focus', handleReturn);
    };
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
      <Text style={styles.screenTitle}>{t('checkout.title')}</Text>
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
          {checkingStatus && (
            <ActivityIndicator color={color.accent} style={{ marginTop: spacing.lg }} />
          )}
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
  screenTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.headingLg,
    color: color.textPrimary,
    marginBottom: spacing.lg,
  },
  disclaimerText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.meta,
    color: color.textMuted,
  },
  card: {
    paddingVertical: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: color.border,
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
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: color.surface,
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
