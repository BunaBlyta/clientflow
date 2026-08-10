import { useLocalSearchParams, useRouter } from 'expo-router';
import { FileText } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { InvoiceRow } from '../../../../../components/InvoiceRow';
import { Divider } from '../../../../../components/ui/Divider';
import { EmptyState } from '../../../../../components/ui/EmptyState';
import { Screen } from '../../../../../components/ui/Screen';
import { spacing } from '../../../../../lib/theme';
import { useDataStore } from '../../../../../store/data-store';

export default function ProjectInvoicesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const invoices = useDataStore((s) => s.invoicesForProject(id)).filter(
    (i) => i.status !== 'DRAFT'
  );

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
});
