import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  CheckCircle2,
  CreditCard,
  Lock,
  XCircle,
} from 'lucide-react-native';
import { useState } from 'react';
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
import { color, fontFamily, fontSize, radius, spacing } from '../../../../../../lib/theme';
import { useDataStore } from '../../../../../../store/data-store';

type Step = 'select' | 'processing' | 'success' | 'failed';

export default function CheckoutScreen() {
  const { invoiceId } = useLocalSearchParams<{ id: string; invoiceId: string }>();
  const router = useRouter();
  const invoice = useDataStore((s) => s.invoiceById(invoiceId));
  const beginPayment = useDataStore((s) => s.beginPayment);
  const resolvePayment = useDataStore((s) => s.resolvePayment);

  const [step, setStep] = useState<Step>('select');

  if (!invoice) {
    return (
      <Screen>
        <Text>Invoice not found.</Text>
      </Screen>
    );
  }

  function handlePay(succeed: boolean) {
    setStep('processing');
    beginPayment(invoiceId);
    setTimeout(() => {
      resolvePayment(invoiceId, succeed);
      setStep(succeed ? 'success' : 'failed');
    }, 1300);
  }

  return (
    <Screen contentContainerStyle={styles.content}>
      <View style={styles.disclaimer}>
        <Lock size={12} color={color.textMuted} />
        <Text style={styles.disclaimerText}>
          Placeholder for Stripe Checkout — no real payment is made here.
        </Text>
      </View>

      {step === 'select' && (
        <>
          <View style={styles.card}>
            <Text style={styles.merchant}>Clientflow Studio</Text>
            <Text style={styles.amount}>{formatCurrency(invoice.amountCents)}</Text>
            <Text style={styles.label}>{invoice.label}</Text>

            <View style={styles.fieldMock}>
              <CreditCard size={16} color={color.textMuted} />
              <Text style={styles.fieldMockText}>Card number</Text>
            </View>
            <View style={styles.fieldRow}>
              <View style={[styles.fieldMock, styles.fieldHalf]}>
                <Text style={styles.fieldMockText}>MM / YY</Text>
              </View>
              <View style={[styles.fieldMock, styles.fieldHalf]}>
                <Text style={styles.fieldMockText}>CVC</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Choose a test card</Text>
          <Button
            label="Pay with •••• 4242 (succeeds)"
            onPress={() => handlePay(true)}
          />
          <View style={{ height: spacing.md }} />
          <Button
            label="Pay with •••• 0002 (declines)"
            variant="secondary"
            onPress={() => handlePay(false)}
          />
        </>
      )}

      {step === 'processing' && (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={color.accent} />
          <Text style={styles.centerTitle}>Confirming with Stripe…</Text>
          <Text style={styles.centerSubtitle}>
            Your project only updates once payment is confirmed — this won't
            resolve until then.
          </Text>
        </View>
      )}

      {step === 'success' && (
        <View style={styles.centerState}>
          <CheckCircle2 size={40} color={color.success} />
          <Text style={styles.centerTitle}>Payment received</Text>
          <Text style={styles.centerSubtitle}>
            {formatCurrency(invoice.amountCents)} for "{invoice.label}" was
            confirmed.
          </Text>
          <View style={{ height: spacing.lg }} />
          <Button label="Return to invoice" onPress={() => router.back()} />
        </View>
      )}

      {step === 'failed' && (
        <View style={styles.centerState}>
          <XCircle size={40} color={color.danger} />
          <Text style={styles.centerTitle}>Payment declined</Text>
          <Text style={styles.centerSubtitle}>
            That test card was declined. Nothing was charged — you can try
            again.
          </Text>
          <View style={{ height: spacing.lg }} />
          <Button label="Try again" onPress={() => setStep('select')} />
          <View style={{ height: spacing.sm }} />
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backLink}>Return to invoice</Text>
          </Pressable>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
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
});
