import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronRight, FileText, MessageSquare } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NoteBubble } from '../../../../components/NoteBubble';
import { ProjectStageTracker } from '../../../../components/ProjectStageTracker';
import { InvoiceRow } from '../../../../components/InvoiceRow';
import { Divider } from '../../../../components/ui/Divider';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { Screen } from '../../../../components/ui/Screen';
import { formatCurrency, formatDate } from '../../../../lib/format';
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
  const recentNotes = notes.filter((note) => note.authorRole !== 'SYSTEM').slice(0, 1);
  const invoicePreviews = visibleInvoices.slice(0, 2);

  return (
    <Screen>
      {unreachable && (
        <Text style={styles.error}>
          {t('common.error')}
        </Text>
      )}

      <Text style={styles.eyebrow}>PROJECT</Text>
      <Text style={styles.name}>{project.name}</Text>
      {pkg && <Text style={styles.packageName}>{pkg.name}</Text>}
      <View style={styles.titleDivider} />

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

      <View style={[styles.section, styles.statusSection]}>
        <Text style={styles.sectionTitle}>{t('projects.status')}</Text>
        <ProjectStageTracker status={project.status} />
      </View>

      <View style={[styles.section, styles.overviewSection]}>
        <Text style={styles.overviewLabel}>{pkg?.name}</Text>
        {pkg?.description && (
          <Text style={styles.overviewDescription}>{pkg.description}</Text>
        )}
        {project.targetLaunchDate && (
          <Text style={styles.overviewTarget}>
            {t('common.target')}: {formatDate(project.targetLaunchDate)}
          </Text>
        )}
      </View>

      <View style={[styles.section, styles.notesSection]}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, styles.sectionHeaderTitle]}>{t('projects.notes')}</Text>
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
            recentNotes.map((note) => (
              <NoteBubble key={note.id} note={note} preview />
            ))
        )}
      </View>

      <View style={[styles.section, styles.invoicesSection]}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, styles.sectionHeaderTitle]}>{t('projects.invoices')}</Text>
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
                  preview
                />
                {index < invoicePreviews.length - 1 && (
                  <View style={styles.previewDivider}>
                    <Divider />
                  </View>
                )}
              </View>
            ))}
            <Text style={styles.invoiceSummary}>
              {t('projects.invoiceCount', { count: visibleInvoices.length })}
            </Text>
          </>
        )}
      </View>
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
  eyebrow: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.meta,
    color: color.accentText,
    letterSpacing: 1.5,
  },
  packageName: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.caption,
    color: color.textMuted,
    marginTop: 2,
  },
  titleDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: color.borderStrong,
    marginTop: spacing.lg,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
  stat: {
    flex: 1,
  },
  statValue: {
    fontFamily: fontFamily.semibold,
    fontSize: 28,
    color: color.textPrimary,
  },
  statLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.meta,
    color: color.textMuted,
    marginTop: 2,
  },
  section: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.border,
    paddingTop: spacing.xxl,
    marginTop: spacing.xxl,
  },
  statusSection: {
    paddingBottom: spacing.xl,
  },
  overviewSection: {
    paddingBottom: spacing.xl,
  },
  notesSection: {
    marginTop: spacing.md,
  },
  invoicesSection: {
    marginTop: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  previewDivider: {
    marginHorizontal: spacing.sm,
  },
  overviewLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.meta,
    color: color.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  overviewDescription: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.body,
    color: color.textSecondary,
    lineHeight: 21,
    marginTop: spacing.sm,
  },
  overviewTarget: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.caption,
    color: color.textMuted,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sectionTitle,
    color: color.textPrimary,
    marginBottom: spacing.md,
  },
  sectionHeaderTitle: {
    marginBottom: 0,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.border,
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
    color: color.accentText,
  },
  invoiceSummary: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.caption,
    color: color.textMuted,
  },
  });
}
