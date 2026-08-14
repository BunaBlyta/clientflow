import { useLocalSearchParams, useRouter } from 'expo-router';
import { FileText } from 'lucide-react-native';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { InvoiceRow } from '../../../../../components/InvoiceRow';
import { Divider } from '../../../../../components/ui/Divider';
import { EmptyState } from '../../../../../components/ui/EmptyState';
import { Screen } from '../../../../../components/ui/Screen';
import { fontFamily, fontSize, spacing, useTheme } from '../../../../../lib/theme';
import { useI18n } from '../../../../../lib/i18n';
import { useDataStore } from '../../../../../store/data-store';
import { useShallow } from 'zustand/react/shallow';
import { useAuthStore } from '../../../../../store/auth-store';

export default function ProjectInvoicesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { color } = useTheme();
  const { t } = useI18n();
  const styles = createStyles(color);
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
    return (
      <Screen>
        <Text style={styles.title}>{t('projects.invoices')}</Text>
        <ActivityIndicator color={color.accent} />
      </Screen>
    );
  }

  if (invoices.length === 0) {
    return (
      <Screen>
        <Text style={styles.title}>{t('projects.invoices')}</Text>
        <EmptyState
          icon={FileText}
          title={t('invoices.emptyTitle')}
          subtitle={t('invoices.emptySubtitle')}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.title}>{t('projects.invoices')}</Text>
      {unreachable && <Text style={styles.error}>{t('invoices.unavailable')}</Text>}
      <View style={styles.listGroup}>
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

function createStyles(color: ReturnType<typeof useTheme>['color']) {
  return StyleSheet.create({
  list: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  listGroup: {
    backgroundColor: color.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border,
    borderRadius: spacing.lg,
    paddingHorizontal: spacing.md,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  title: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.headingLg,
    color: color.textPrimary,
    marginBottom: spacing.md,
  },
  error: {
    paddingTop: spacing.md,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.meta,
    color: color.warning,
  },
  });
}
