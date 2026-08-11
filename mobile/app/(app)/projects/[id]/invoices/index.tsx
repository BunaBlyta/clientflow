import { useLocalSearchParams, useRouter } from 'expo-router';
import { FileText } from 'lucide-react-native';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { InvoiceRow } from '../../../../../components/InvoiceRow';
import { Divider } from '../../../../../components/ui/Divider';
import { EmptyState } from '../../../../../components/ui/EmptyState';
import { Screen } from '../../../../../components/ui/Screen';
import { color, fontFamily, fontSize, spacing } from '../../../../../lib/theme';
import { useDataStore } from '../../../../../store/data-store';
import { useShallow } from 'zustand/react/shallow';
import { useAuthStore } from '../../../../../store/auth-store';

export default function ProjectInvoicesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const refreshInvoices = useDataStore((s) => s.refreshInvoices);
  const [loading, setLoading] = useState(true);
  const [unreachable, setUnreachable] = useState(false);
  const invoices = useDataStore(
    useShallow((s) => s.invoicesForProject(id).filter((i) => i.status !== 'DRAFT'))
  );

  useEffect(() => {
    if (!token || !id) {
      setLoading(false);
      return;
    }
    let active = true;
    void refreshInvoices(token, id).then((ok) => {
      if (active) {
        setUnreachable(!ok);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [id, refreshInvoices, token]);

  if (loading && invoices.length === 0) {
    return <Screen><ActivityIndicator color={color.accent} /></Screen>;
  }

  if (invoices.length === 0) {
    return (
      <Screen>
        <EmptyState
          icon={FileText}
          title="No invoices yet"
          subtitle="Invoices will show up here once the studio sends one."
        />
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      {unreachable && <Text style={styles.error}>Live invoices are unavailable. Showing saved invoice data.</Text>}
      <View style={styles.list}>
        {invoices.map((invoice, index) => (
          <View key={invoice.id}>
            <InvoiceRow
              invoice={invoice}
              onPress={() => router.push(`/projects/${id}/invoices/${invoice.id}`)}
            />
            {index < invoices.length - 1 && <Divider />}
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  error: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.meta,
    color: color.warning,
  },
});
