import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronRight, FileText, MessageSquare } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NoteBubble } from '../../../../components/NoteBubble';
import { ProjectStageTracker } from '../../../../components/ProjectStageTracker';
import { InvoiceRow } from '../../../../components/InvoiceRow';
import { Divider } from '../../../../components/ui/Divider';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { Screen } from '../../../../components/ui/Screen';
import { formatCurrency } from '../../../../lib/format';
import { getPackageById } from '../../../../lib/mock-data';
import { fontFamily, fontSize, spacing, useTheme } from '../../../../lib/theme';
import { useI18n } from '../../../../lib/i18n';
import { useAuthStore } from '../../../../store/auth-store';
import { useDataStore } from '../../../../store/data-store';
import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { color } = useTheme();
  const { t } = useI18n();
  const styles = createStyles(color);
  const token = useAuthStore((s) => s.token);
  const project = useDataStore((s) => s.projectById(id));
  const refreshProject = useDataStore((s) => s.refreshProject);
  const refreshNotes = useDataStore((s) => s.refreshNotes);
  const refreshInvoices = useDataStore((s) => s.refreshInvoices);
  const invoices = useDataStore(useShallow((s) => s.invoicesForProject(id)));
  const notes = useDataStore(useShallow((s) => s.notesForProject(id)));
  const [unreachable, setUnreachable] = useState(false);

  useEffect(() => {
    if (!id || !token) return;

    void refreshProject(id, token);
    let active = true;
    void Promise.all([
      refreshNotes(token, id),
      refreshInvoices(token, id),
    ]).then(([notesReachable, invoicesReachable]) => {
      if (active) setUnreachable(!notesReachable || !invoicesReachable);
    });

    return () => {
      active = false;
    };
  }, [id, refreshInvoices, refreshNotes, refreshProject, token]);

  if (!project) {
    return (
      <Screen>
        <EmptyState icon={FileText} title={t('projects.projectNotFound')} />
      </Screen>
    );
  }

  const pkg = getPackageById(project.packageId);
  const visibleInvoices = invoices.filter((i) => i.status !== 'DRAFT');
  const paidTotal = invoices
    .filter((i) => i.status === 'PAID')
    .reduce((sum, i) => sum + i.amountCents, 0);
  const outstandingTotal = invoices
    .filter((i) => i.status === 'SENT' || i.status === 'FAILED' || i.status === 'PAYMENT_PENDING')
    .reduce((sum, i) => sum + i.amountCents, 0);

  // notesForProject sorts newest first, so the first two are the recent preview.
  const recentNotes = notes.slice(0, 2);
  const invoicePreviews = visibleInvoices.slice(0, 2);

  return (
    <Screen>
      <Stack.Screen options={{ title: project.name }} />

      {unreachable && (
        <Text style={styles.error}>
          {t('common.error')}
        </Text>
      )}

      <Text style={styles.name}>{project.name}</Text>
      {pkg && <Text style={styles.packageName}>{pkg.name}</Text>}

      <View style={styles.statRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{formatCurrency(paidTotal)}</Text>
          <Text style={styles.statLabel}>{t('projects.paidToDate')}</Text>
        </View>
        <View style={styles.stat}>
          <Text
            style={[
              styles.statValue,
              outstandingTotal > 0 && { color: color.warning },
            ]}
          >
            {formatCurrency(outstandingTotal)}
          </Text>
          <Text style={styles.statLabel}>{t('projects.outstanding')}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>{t('projects.status')}</Text>
      <ProjectStageTracker status={project.status} />

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>{t('projects.notes')}</Text>
        <Pressable
          onPress={() => router.push(`/projects/${project.id}/notes`)}
          style={styles.viewAllRow}
        >
          <Text style={styles.viewAllText}>{t('common.viewAll')}</Text>
          <ChevronRight size={14} color={color.accent} />
        </Pressable>
      </View>
      {recentNotes.length === 0 ? (
        <EmptyState icon={MessageSquare} title={t('projects.noNotes')} />
      ) : (
        recentNotes.map((note) => <NoteBubble key={note.id} note={note} />)
      )}

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>{t('projects.invoices')}</Text>
        <Pressable
          onPress={() => router.push(`/projects/${project.id}/invoices`)}
          style={styles.viewAllRow}
        >
          <Text style={styles.viewAllText}>{t('common.viewAll')}</Text>
          <ChevronRight size={14} color={color.accent} />
        </Pressable>
      </View>
      {visibleInvoices.length === 0 ? (
        <EmptyState icon={FileText} title={t('projects.noInvoices')} />
      ) : (
        <>
          {invoicePreviews.map((invoice, index) => (
            <View key={invoice.id}>
              <InvoiceRow
                invoice={invoice}
                onPress={() => router.push(`/projects/${id}/invoices/${invoice.id}`)}
              />
              {index < invoicePreviews.length - 1 && <Divider />}
            </View>
          ))}
          <Text style={styles.invoiceSummary}>
            {t('projects.invoiceCount', { count: visibleInvoices.length })}
          </Text>
        </>
      )}
    </Screen>
  );
}

function createStyles(color: ReturnType<typeof useTheme>['color']) {
  return StyleSheet.create({
  error: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.meta,
    color: color.warning,
    marginBottom: spacing.md,
  },
  name: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.headingLg,
    color: color.textPrimary,
    marginTop: spacing.sm,
  },
  packageName: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.caption,
    color: color.textMuted,
    marginTop: 2,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.xxl,
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  stat: {},
  statValue: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.heading,
    color: color.textPrimary,
  },
  statLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.meta,
    color: color.textMuted,
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sectionTitle,
    color: color.textPrimary,
    marginBottom: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.caption,
    color: color.accent,
  },
  invoiceSummary: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.caption,
    color: color.textMuted,
  },
  });
}
