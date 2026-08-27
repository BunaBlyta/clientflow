import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronRight, FileText, MessageSquare } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NoteBubble } from '../../../../components/NoteBubble';
import { ProjectStageTracker } from '../../../../components/ProjectStageTracker';
import { InvoiceRow } from '../../../../components/InvoiceRow';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { InvoiceRowSkeleton, NoteBubbleSkeleton, Skeleton } from '../../../../components/ui/Skeleton';
import { Screen } from '../../../../components/ui/Screen';
import { formatDate } from '../../../../lib/format';
import { getPackageById } from '../../../../lib/mock-data';
import { fontFamily, fontSize, radius, spacing, textShadow, useTheme } from '../../../../lib/theme';
import { useI18n } from '../../../../lib/i18n';
import { useAuthStore } from '../../../../store/auth-store';
import { useDataStore } from '../../../../store/data-store';
import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Card } from '../../../../components/ui/Card';
import { RadialRing } from '../../../../components/ui/RadialRing';
import { PROJECT_STAGES, getProjectStatusLabel, getProjectStatusMeta } from '../../../../lib/status';
import { AppBackButton } from '../../../../components/OriginBackButton';

export default function ProjectDetailScreen() {
  const { id, source, tab } = useLocalSearchParams<{
    id: string;
    source?: string;
    tab?: string;
  }>();
  const router = useRouter();
  const { color } = useTheme();
  const { language, t } = useI18n();
  const styles = createStyles(color);
  const token = useAuthStore((s) => s.token);
  const client = useAuthStore((s) => s.client);
  const project = useDataStore((s) => s.projectById(id));
  const refreshProject = useDataStore((s) => s.refreshProject);
  const refreshNotes = useDataStore((s) => s.refreshNotes);
  const refreshInvoices = useDataStore((s) => s.refreshInvoices);
  const invoices = useDataStore(useShallow((s) => s.invoicesForProject(id)));
  const notes = useDataStore(useShallow((s) => s.notesForProject(id)));
  const [unreachable, setUnreachable] = useState(false);
  // Starts true even when the project itself is cached, so the notes and
  // invoices sections show skeletons (not their "nothing here yet" empty
  // states) while their own fetches are still in flight. Sections only fall
  // back to the skeleton when they have no data yet, so a cached list still
  // renders immediately with no flash.
  const [loading, setLoading] = useState(true);
  const projectRoute = tab === 'notifications'
    ? `/notifications/projects/${id}` as const
    : `/projects/${id}` as const;

  useEffect(() => {
    if (!id || !token) {
      setLoading(false);
      return;
    }

    let active = true;
    void Promise.all([
      refreshProject(id, token),
      refreshNotes(token, id),
      refreshInvoices(token, id),
    ]).then(([, notesReachable, invoicesReachable]) => {
      if (active) {
        setUnreachable(!notesReachable || !invoicesReachable);
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [id, refreshInvoices, refreshNotes, refreshProject, token]);

  if (!project) {
    return (
      <Screen>
        <AppBackButton source={source} accessibilityLabel={t('common.backToProjects')} />
        {loading ? (
          <ProjectDetailSkeleton styles={styles} />
        ) : (
          <EmptyState icon={FileText} title={t('projects.projectNotFound')} />
        )}
      </Screen>
    );
  }

  const pkg = getPackageById(project.packageId);
  const visibleInvoices = invoices.filter((i) => i.status !== 'DRAFT');
  // notesForProject sorts newest first, so the first note is the recent preview.
  const visibleNotes = notes.filter((note) => note.authorRole !== 'SYSTEM');
  const recentNotes = visibleNotes.slice(0, 1);
  const invoicePreviews = visibleInvoices.slice(0, 2);

  return (
    <Screen>
      <View style={styles.topbar}>
        <AppBackButton source={source} accessibilityLabel={t('common.backToProjects')} />
        <View style={styles.topbarTitle}>
          <Text style={styles.topbarProjectName} numberOfLines={1}>{project.name}</Text>
          <Text style={styles.topbarClientName} numberOfLines={1}>{client?.companyName ?? pkg?.name ?? ''}</Text>
        </View>
        <View style={styles.topbarSpacer} />
      </View>
      {unreachable && (
        <Text style={styles.error}>
          {t('common.error')}
        </Text>
      )}

      <Card padding={20} style={[styles.section, styles.statusSection]}>
        <View style={styles.overviewHeader}>
          <Text style={[styles.sectionTitle, styles.sectionHeaderTitle]}>{t('ui.projectOverview')}</Text>
          <View style={[styles.statusPill, { backgroundColor: getProjectStatusMeta(project.status, color, t).bg }]}>
            <Text style={[styles.statusPillText, { color: getProjectStatusMeta(project.status, color, t).text }]}>{getProjectStatusLabel(project.status, t)}</Text>
          </View>
        </View>
        <View style={styles.ringWrap}>
          <RadialRing
            ratio={Math.max(0, PROJECT_STAGES.indexOf(project.status)) / (PROJECT_STAGES.length - 1)}
            size={128}
            strokeWidth={10}
            centerValue={`${Math.max(0, PROJECT_STAGES.indexOf(project.status))} / ${PROJECT_STAGES.length - 1}`}
            centerLabel={[t('ui.phases'), t('ui.active')]}
          />
        </View>
        <View style={styles.phaseTracker}>
          <ProjectStageTracker status={project.status} />
        </View>
        <View style={styles.dateRow}>
          <Text style={styles.dateText}>{t('ui.started', { date: formatDate(project.createdAt, language) })}</Text>
          <Text style={styles.dateText}>{project.targetLaunchDate ? t('ui.estimatedLaunch', { date: formatDate(project.targetLaunchDate, language) }) : t('ui.notScheduled')}</Text>
        </View>
      </Card>

      <Card tone="surface" style={[styles.section, styles.notesSection]}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, styles.sectionHeaderTitle]}>{t('projects.notes')}</Text>
          <Pressable
            onPress={() =>
              router.push(
                tab === 'notifications'
                  ? `${projectRoute}/notes?tab=notifications`
                  : `${projectRoute}/notes`,
              )
            }
            style={styles.viewAllRow}
          >
            <Text style={styles.viewAllText}>{t('common.viewAll')}</Text>
            <ChevronRight size={14} color={color.accent} />
          </Pressable>
        </View>
        {loading && recentNotes.length === 0 ? (
          <NoteBubbleSkeleton />
        ) : recentNotes.length === 0 ? (
          <EmptyState icon={MessageSquare} title={t('projects.noNotes')} />
        ) : (
            recentNotes.map((note) => (
              <NoteBubble key={note.id} note={note} preview />
            ))
        )}
        {!(loading && recentNotes.length === 0) && (
          <>
            <View style={styles.sectionFooterDivider} />
            <Text style={styles.noteSummary}>
              {t('notes.noteCount', { count: visibleNotes.length })}
            </Text>
          </>
        )}
      </Card>

      <Card tone="surface" style={[styles.section, styles.invoicesSection]}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, styles.sectionHeaderTitle]}>{t('projects.invoices')}</Text>
          <Pressable
            onPress={() =>
              router.push(
                tab === 'notifications'
                  ? `${projectRoute}/invoices?tab=notifications`
                  : `${projectRoute}/invoices`,
              )
            }
            style={styles.viewAllRow}
          >
            <Text style={styles.viewAllText}>{t('common.viewAll')}</Text>
            <ChevronRight size={14} color={color.accent} />
          </Pressable>
        </View>
        {loading && visibleInvoices.length === 0 ? (
          <View style={styles.invoicePreviewList}>
            <InvoiceRowSkeleton />
            <InvoiceRowSkeleton />
          </View>
        ) : visibleInvoices.length === 0 ? (
          <EmptyState icon={FileText} title={t('projects.noInvoices')} />
        ) : (
          <>
            <View style={styles.invoicePreviewList}>
              {invoicePreviews.map((invoice) => (
                <InvoiceRow
                  key={invoice.id}
                  invoice={invoice}
                  onPress={() =>
                    router.push(
                      tab === 'notifications'
                        ? `${projectRoute}/invoices/${invoice.id}?tab=notifications`
                        : `${projectRoute}/invoices/${invoice.id}`,
                    )
                  }
                  preview
                />
              ))}
            </View>
            <View style={styles.sectionFooterDivider} />
            <Text style={styles.invoiceSummary}>
              {t('projects.invoiceCount', { count: visibleInvoices.length })}
            </Text>
          </>
        )}
      </Card>
    </Screen>
  );
}

function ProjectDetailSkeleton({ styles }: { styles: ReturnType<typeof createStyles> }) {
  const { color } = useTheme();
  const card: object = {
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.xl,
    backgroundColor: color.surface,
    padding: 20,
  };
  return (
    <View>
      <View style={styles.topbar}>
        <View style={{ flex: 1, alignItems: 'center', gap: spacing.xs }}>
          <Skeleton width={140} height={16} />
          <Skeleton width={90} height={11} />
        </View>
      </View>
      <View style={card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
          <Skeleton width={110} height={14} />
          <Skeleton width={72} height={22} radius={radius.pill} />
        </View>
        <View style={{ alignItems: 'center', paddingVertical: spacing.md }}>
          <Skeleton width={128} height={128} radius={64} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm, marginTop: spacing.md }}>
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} width="18%" height={6} radius={3} />
          ))}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg }}>
          <Skeleton width="40%" height={11} />
          <Skeleton width="40%" height={11} />
        </View>
      </View>
      {Array.from({ length: 2 }).map((_, index) => (
        <View key={index} style={[card, { marginTop: spacing.xl }]}>
          <Skeleton width={120} height={14} style={{ marginBottom: spacing.md }} />
          <Skeleton width="90%" height={12} />
          <Skeleton width="65%" height={12} style={{ marginTop: spacing.sm }} />
        </View>
      ))}
    </View>
  );
}

function createStyles(color: ReturnType<typeof useTheme>['color']) {
  return StyleSheet.create({
  error: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.meta,
    color: color.danger,
    marginBottom: spacing.md,
  },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  topbarTitle: { flex: 1, alignItems: 'center', minWidth: 0 },
  topbarProjectName: { fontFamily: fontFamily.serif, fontSize: fontSize.cardTitle + 2, color: color.textPrimary },
  topbarClientName: { fontFamily: fontFamily.regular, fontSize: fontSize.meta, color: color.textSecondary, marginTop: 2 },
  topbarSpacer: { width: 44 },
  name: { ...textShadow, fontFamily: fontFamily.serif, fontSize: fontSize.heading, color: color.textPrimary, marginTop: spacing.md, textAlign: 'center' },
  packageName: { fontFamily: fontFamily.regular, fontSize: fontSize.caption, color: color.textMuted, marginTop: spacing.xs, textAlign: 'center' },
  section: {
    padding: 20,
    marginTop: spacing.xl,
  },
  statusSection: {
    marginTop: 0,
    padding: 20,
    paddingBottom: spacing.lg,
  },
  overviewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  ringWrap: { alignItems: 'center', justifyContent: 'center', width: '100%' },
  phaseTracker: { marginTop: spacing.md },
  statusPill: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  statusPillText: { fontFamily: fontFamily.semibold, fontSize: fontSize.meta, textTransform: 'uppercase' },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.border, paddingTop: spacing.lg, marginTop: spacing.lg },
  dateText: { flex: 1, fontFamily: fontFamily.regular, fontSize: fontSize.caption, color: color.textMuted },
  notesSection: {
    marginTop: spacing.xl,
  },
  invoicesSection: {
    marginTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  invoicePreviewList: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fontFamily.serif,
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
    paddingBottom: 0,
    marginBottom: spacing.md,
  },
  sectionFooterDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: color.border,
    marginTop: spacing.md,
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
  noteSummary: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.caption,
    color: color.textMuted,
  },
  });
}
