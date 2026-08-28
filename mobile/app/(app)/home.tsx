import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, FolderKanban } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { EmptyState } from '../../components/ui/EmptyState';
import { NotificationRowSkeleton, Skeleton } from '../../components/ui/Skeleton';
import { Screen } from '../../components/ui/Screen';
import { formatCurrency, formatDate } from '../../lib/format';
import { getProjectStatusLabel, getProjectStatusMeta, PROJECT_STAGES } from '../../lib/status';
import { fontFamily, fontSize, radius, spacing, textShadow, useTheme } from '../../lib/theme';
import { useI18n } from '../../lib/i18n';
import { getLocalizedNotificationText } from '../../lib/notification-text';
import { readHomeProjectId, writeHomeProjectId } from '../../lib/home-project-preference';
import { useAuthStore } from '../../store/auth-store';
import { useDataStore } from '../../store/data-store';
import { useShallow } from 'zustand/react/shallow';
import { Card } from '../../components/ui/Card';
import { useProjectTabNavigation } from '../../lib/project-tab-navigation';
import { NotificationRow } from '../../components/NotificationRow';

export default function HomeScreen() {
  const router = useRouter();
  const projectNavigation = useProjectTabNavigation();
  const { color } = useTheme();
  const { language, t } = useI18n();
  const styles = createStyles(color);
  const client = useAuthStore((s) => s.client);
  const token = useAuthStore((s) => s.token);
  const projects = useDataStore(useShallow((s) => s.projects));
  const invoices = useDataStore(useShallow((s) => s.invoices.filter((invoice) => invoice.status !== 'DRAFT')));
  const notifications = useDataStore(useShallow((s) => [...s.notifications].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 3)));
  const refreshProjects = useDataStore((s) => s.refreshProjects);
  const refreshInvoices = useDataStore((s) => s.refreshInvoices);
  const [loading, setLoading] = useState(true);
  const [homeProjectId, setHomeProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let active = true;
    void Promise.all([refreshProjects(token), refreshInvoices(token)]).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [refreshInvoices, refreshProjects, token]);

  useEffect(() => {
    let active = true;
    void readHomeProjectId().then((id) => {
      if (active) setHomeProjectId(id);
    });
    return () => {
      active = false;
    };
  }, []);

  // -1 (not found — stale/deleted project, or nothing saved yet) falls
  // back to the first project via Math.max, same as no preference at all.
  const projectIndex = homeProjectId ? Math.max(0, projects.findIndex((p) => p.id === homeProjectId)) : 0;
  const project = projects[projectIndex];

  function switchProject(step: 1 | -1) {
    if (projects.length < 2) return;
    const nextIndex = (projectIndex + step + projects.length) % projects.length;
    const next = projects[nextIndex];
    setHomeProjectId(next.id);
    void writeHomeProjectId(next.id);
  }
  const payableInvoice = invoices.find((invoice) => invoice.status === 'SENT' || invoice.status === 'FAILED');
  const unreadMessages = notifications.filter((notification) => !notification.read).length;
  const phaseCount = project ? Math.max(0, PROJECT_STAGES.indexOf(project.status)) : 0;
  const phaseStatus = project?.status === 'PENDING' ? 'DISCOVERY' : project?.status;

  return (
    <Screen>
      <View style={styles.headingRow}>
        <View style={styles.headingCopy}>
          <Text style={styles.greeting}>{t('home.goodAfternoon')},</Text>
          <Text style={styles.userName}>{client?.name?.split(' ')[0] ?? t('projects.greeting')}</Text>
        </View>
      </View>

      {loading && !project ? (
        <HomeSkeleton styles={styles} />
      ) : !project ? (
        <EmptyState icon={FolderKanban} title={t('projects.emptyTitle')} subtitle={t('projects.emptySubtitle')} />
      ) : (
        <>
          <Pressable
            accessibilityRole="button"
            onPress={() => projectNavigation.openProject(project.id, 'home')}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Card tone="glow" padding={20} style={styles.statusSection}>
              <View style={styles.statusHeader}>
                <View style={styles.statusCopy}>
                  <Text style={styles.projectName} numberOfLines={2}>{project.name}</Text>
                </View>
                <View style={styles.statusRight}>
                  {projects.length > 1 && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t('ui.previousProject')}
                      hitSlop={8}
                      onPress={(event) => {
                        event.stopPropagation();
                        switchProject(-1);
                      }}
                      style={({ pressed }) => pressed && styles.pressed}
                    >
                      <ChevronLeft size={16} color={color.textMuted} strokeWidth={1.8} />
                    </Pressable>
                  )}
                  <View style={styles.statusLink}>
                    <Text style={[styles.statusValue, { color: getProjectStatusMeta(project.status, color, t).text }]}>
                      {getProjectStatusLabel(project.status, t)}
                    </Text>
                  </View>
                  {projects.length > 1 && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t('ui.nextProject')}
                      hitSlop={8}
                      onPress={(event) => {
                        event.stopPropagation();
                        switchProject(1);
                      }}
                      style={({ pressed }) => pressed && styles.pressed}
                    >
                      <ChevronRight size={16} color={color.textMuted} strokeWidth={1.8} />
                    </Pressable>
                  )}
                </View>
              </View>
              <View style={styles.phaseRow}>
                <View style={styles.phaseChips}>
                  {PROJECT_STAGES.slice(1).map((stage, index) => (
                    <View key={stage} style={[styles.phaseChip, index < phaseCount && styles.phaseChipActive]} />
                  ))}
                </View>
                <Text style={styles.phaseText}>{t('ui.phase', { status: getProjectStatusLabel(phaseStatus ?? 'DISCOVERY', t) })}</Text>
              </View>
              <View style={styles.statusDivider} />
              <View style={styles.dateRow}>
                <Text style={styles.dateText}>{t('ui.started', { date: formatDate(project.createdAt, language) })}</Text>
                <Text style={[styles.dateText, styles.dateTextRight]}>
                  {project.targetLaunchDate
                    ? t(project.status === 'LAUNCHED' ? 'ui.launched' : 'ui.estimatedLaunch', { date: formatDate(project.targetLaunchDate, language) })
                    : t('ui.notScheduled')}
                </Text>
              </View>
              <View style={styles.detailsRow}>
                <Text style={styles.detailsText}>{t('ui.viewDetails')}</Text>
                <ChevronRight size={18} color={color.accent} />
              </View>
            </Card>
          </Pressable>

          <View style={styles.statsRow}>
            <Pressable
              onPress={() => payableInvoice ? projectNavigation.openInvoice(payableInvoice.projectId, payableInvoice.id, 'home') : router.push('/invoices')}
              style={({ pressed }) => [styles.statCard, pressed && styles.pressed]}
            >
              <Text style={styles.statLabel}>{t('ui.nextPayment')}</Text>
              <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
              {payableInvoice ? formatCurrency(payableInvoice.amountCents, language) : formatCurrency(0, language)}
              </Text>
              <Text style={styles.statHint} numberOfLines={1}>
                {payableInvoice?.dueDate ? `${t('invoices.due')} ${formatDate(payableInvoice.dueDate, language)}` : t('ui.noPaymentsDue')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/notifications')}
              style={({ pressed }) => [styles.statCard, pressed && styles.pressed]}
            >
              <Text style={styles.statLabel}>{t('ui.messages')}</Text>
              <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{t('ui.newMessages', { count: unreadMessages })}</Text>
              <Text style={styles.statHint} numberOfLines={1}>
                {unreadMessages > 0 && notifications[0] ? getLocalizedNotificationText(notifications[0], t).title : t('ui.noNewMessages')}
              </Text>
            </Pressable>
          </View>

          <View style={styles.activityHeader}>
            <Text style={styles.activityTitle}>{t('ui.recentActivity')}</Text>
            <Pressable onPress={() => router.push('/notifications')}>
              <Text style={styles.activityLink}>{t('ui.seeAll')}</Text>
            </Pressable>
          </View>
          <View>
            {notifications.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                onPress={() => router.push('/notifications')}
              />
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}

function HomeSkeleton({ styles }: { styles: ReturnType<typeof createStyles> }) {
  const { color } = useTheme();
  return (
    <View>
      <View style={[styles.statusSection, { borderWidth: 1, borderColor: color.border, borderRadius: 18, padding: spacing.lg, backgroundColor: color.surface }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
          <Skeleton width="55%" height={16} />
          <Skeleton width={80} height={22} radius={999} />
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: spacing.lg }}>
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} width={20} height={6} radius={3} />
          ))}
        </View>
        <Skeleton height={1} radius={0} style={{ marginTop: spacing.md }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md }}>
          <Skeleton width="40%" height={11} />
          <Skeleton width="40%" height={11} />
        </View>
      </View>
      <View style={styles.statsRow}>
        {Array.from({ length: 2 }).map((_, index) => (
          <View key={index} style={styles.statCard}>
            <Skeleton width="70%" height={10} />
            <Skeleton width="80%" height={18} style={{ marginTop: spacing.sm }} />
            <Skeleton width="55%" height={10} style={{ marginTop: spacing.xs }} />
          </View>
        ))}
      </View>
      <View style={styles.activityHeader}>
        <Skeleton width={120} height={16} />
      </View>
      <View>
        {Array.from({ length: 3 }).map((_, index) => (
          <NotificationRowSkeleton key={index} />
        ))}
      </View>
    </View>
  );
}

function createStyles(color: ReturnType<typeof useTheme>['color']) {
  return StyleSheet.create({
    headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headingCopy: { flex: 1 },
    greeting: { fontFamily: fontFamily.regular, fontSize: fontSize.body, color: color.textSecondary, ...textShadow },
    userName: { fontFamily: fontFamily.serif, fontSize: fontSize.headingLg, color: color.textPrimary, marginTop: spacing.xs },
    subtitle: { fontFamily: fontFamily.regular, fontSize: fontSize.body, color: color.textMuted, marginTop: spacing.sm, ...textShadow },
    statusSection: { marginTop: spacing.xl },
    statusHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
    statusCopy: { flex: 1 },
    projectName: { flex: 1, fontFamily: fontFamily.serif, fontSize: fontSize.cardTitle + 2, color: color.textPrimary },
    statusRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    statusLink: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: color.surfaceMuted },
    statusValue: { fontFamily: fontFamily.semibold, fontSize: fontSize.meta, textTransform: 'uppercase' },
    phaseRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg },
    phaseChips: { flexDirection: 'row', gap: spacing.xs },
    phaseChip: { width: 20, height: 6, borderRadius: 3, backgroundColor: color.surfaceMuted },
    phaseChipActive: { backgroundColor: color.accent },
    phaseText: { flex: 1, fontFamily: fontFamily.semibold, fontSize: fontSize.meta, color: color.textPrimary },
    statusDivider: { height: 1, backgroundColor: color.border, marginTop: spacing.md },
    dateRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, marginTop: spacing.sm },
    dateText: { flex: 1, fontFamily: fontFamily.regular, fontSize: fontSize.caption, color: color.textMuted },
    dateTextRight: { textAlign: 'right' },
    detailsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: spacing.xs, marginTop: spacing.lg },
    detailsText: { fontFamily: fontFamily.semibold, fontSize: fontSize.cardTitle, color: color.accent },
    statsRow: { flexDirection: 'row', alignItems: 'stretch', gap: spacing.md, marginTop: spacing.md },
    statCard: { flex: 1, padding: spacing.lg, minHeight: 104, borderRadius: radius.md, backgroundColor: color.surfaceMuted },
    statLabel: { fontFamily: fontFamily.semibold, fontSize: fontSize.meta, color: color.textSecondary, textTransform: 'uppercase', letterSpacing: 0.7 },
    statValue: { fontFamily: fontFamily.serif, fontSize: fontSize.heading, color: color.textPrimary, marginTop: spacing.sm },
    statHint: { fontFamily: fontFamily.regular, fontSize: fontSize.caption, color: color.textMuted, marginTop: spacing.xs },
    activityHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xl, marginBottom: spacing.sm },
    activityTitle: { fontFamily: fontFamily.serif, fontSize: fontSize.sectionTitle, color: color.textPrimary },
    activityLink: { fontFamily: fontFamily.semibold, fontSize: fontSize.body, color: color.accent },
    pressed: { opacity: 0.62 },
  });
}
