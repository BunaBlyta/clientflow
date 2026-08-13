import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, FileText } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
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
        <Pressable onPress={() => router.replace(`/projects/${id}`)} style={styles.backControl}>
          <ArrowLeft size={16} color={color.accent} />
          <Text style={styles.backControlText}>{t('common.backToProject')}</Text>
        </Pressable>
        <ActivityIndicator color={color.accent} />
      </Screen>
    );
  }

  if (invoices.length === 0) {
    return (
      <Screen>
        <Pressable onPress={() => router.replace(`/projects/${id}`)} style={styles.backControl}>
          <ArrowLeft size={16} color={color.accent} />
          <Text style={styles.backControlText}>{t('common.backToProject')}</Text>
        </Pressable>
        <EmptyState
          icon={FileText}
          title={t('invoices.emptyTitle')}
          subtitle={t('invoices.emptySubtitle')}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <Pressable onPress={() => router.replace(`/projects/${id}`)} style={styles.backControl}>
        <ArrowLeft size={16} color={color.accent} />
        <Text style={styles.backControlText}>{t('common.backToProject')}</Text>
      </Pressable>
      {unreachable && <Text style={styles.error}>{t('invoices.unavailable')}</Text>}
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

function createStyles(color: ReturnType<typeof useTheme>['color']) {
  return StyleSheet.create({
  backControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  backControlText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.caption,
    color: color.accent,
  },
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
}
