import { useRouter } from 'expo-router';
import { ArrowUpRight, FolderKanban } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect } from 'react';
import { EmptyState } from '../../components/ui/EmptyState';
import { Screen } from '../../components/ui/Screen';
import { formatCurrency, formatDate } from '../../lib/format';
import { getProjectStatusLabel, getProjectStatusMeta, PROJECT_STAGES } from '../../lib/status';
import { fontFamily, fontSize, radius, spacing, textShadow, useTheme } from '../../lib/theme';
import { useI18n } from '../../lib/i18n';
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
  const { t } = useI18n();
  const styles = createStyles(color);
  const client = useAuthStore((s) => s.client);
  const token = useAuthStore((s) => s.token);
  const projects = useDataStore(useShallow((s) => s.projects));
  const invoices = useDataStore(useShallow((s) => s.invoices.filter((invoice) => invoice.status !== 'DRAFT')));
  const notifications = useDataStore(useShallow((s) => [...s.notifications].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 3)));
  const refreshProjects = useDataStore((s) => s.refreshProjects);
  const refreshInvoices = useDataStore((s) => s.refreshInvoices);

  useEffect(() => {
    if (!token) return;
    void refreshProjects(token);
    void refreshInvoices(token);
  }, [refreshInvoices, refreshProjects, token]);

  const project = projects[0];
  const payableInvoice = invoices.find((invoice) => invoice.status === 'SENT' || invoice.status === 'FAILED');
  const unreadMessages = notifications.filter((notification) => !notification.read).length;
  const phaseCount = project ? Math.max(0, PROJECT_STAGES.indexOf(project.status)) : 0;
  const phaseStatus = project?.status === 'PENDING' ? 'DISCOVERY' : project?.status;

  return (
    <Screen>
      <View style={styles.headingRow}>
        <View style={styles.headingCopy}>
          <Text style={styles.greeting}>{t('home.goodAfternoon')}</Text>
          <Text style={styles.userName}>{client?.name?.split(' ')[0] ?? t('projects.greeting')}</Text>
        </View>
      </View>

      {!project ? (
        <EmptyState icon={FolderKanban} title={t('projects.emptyTitle')} subtitle={t('projects.emptySubtitle')} />
      ) : (
        <>
          <Card tone="glow" padding={20} style={styles.statusSection}>
            <View style={styles.statusHeader}>
              <View style={styles.statusCopy}>
                <Text style={styles.heroKicker}>{client?.companyName ?? t('projects.status')}</Text>
                <Text style={styles.projectName} numberOfLines={2}>{project.name}</Text>
              </View>
              <Pressable
                onPress={() => projectNavigation.openProject(project.id, 'home')}
                style={({ pressed }) => [styles.statusLink, pressed && styles.pressed]}
              >
                <Text style={[styles.statusValue, { color: getProjectStatusMeta(project.status, color, t).text }]}>
                  {getProjectStatusLabel(project.status, t)}
                </Text>
                <ArrowUpRight size={17} color={color.textMuted} />
              </Pressable>
            </View>
            <View style={styles.phaseRow}>
              <View style={styles.phaseChips}>
                {PROJECT_STAGES.slice(1).map((stage, index) => (
                  <View key={stage} style={[styles.phaseChip, index < phaseCount && styles.phaseChipActive]} />
                ))}
              </View>
              <Text style={styles.phaseText}>{getProjectStatusLabel(phaseStatus ?? 'DISCOVERY', t)} phase</Text>
            </View>
            <View style={styles.dateRow}>
              <Text style={styles.dateText}>Started {formatDate(project.createdAt)}</Text>
              <Text style={styles.dateText}>{project.targetLaunchDate ? `Est. launch ${formatDate(project.targetLaunchDate)}` : 'Not scheduled'}</Text>
            </View>
            <Pressable onPress={() => projectNavigation.openProject(project.id, 'home')} style={styles.detailsRow}>
              <Text style={styles.detailsText}>View details</Text>
              <ArrowUpRight size={18} color={color.accent} />
            </Pressable>
          </Card>

          <View style={styles.statsRow}>
            <Pressable
              onPress={() => payableInvoice ? projectNavigation.openInvoice(payableInvoice.projectId, payableInvoice.id, 'home') : router.push('/invoices')}
              style={({ pressed }) => [styles.statCard, pressed && styles.pressed]}
            >
              <Text style={styles.statLabel}>NEXT PAYMENT</Text>
              <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
                {payableInvoice ? formatCurrency(payableInvoice.amountCents) : '$0'}
              </Text>
              <Text style={styles.statHint} numberOfLines={1}>
                {payableInvoice?.dueDate ? `Due ${formatDate(payableInvoice.dueDate)}` : 'No payments due'}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/notifications')}
              style={({ pressed }) => [styles.statCard, pressed && styles.pressed]}
            >
              <Text style={styles.statLabel}>MESSAGES</Text>
              <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{unreadMessages} new</Text>
              <Text style={styles.statHint} numberOfLines={1}>{notifications[0]?.title ?? 'You’re all caught up'}</Text>
            </Pressable>
          </View>

          <View style={styles.activityHeader}>
            <Text style={styles.activityTitle}>Recent activity</Text>
            <Pressable onPress={() => router.push('/notifications')}>
              <Text style={styles.activityLink}>See all</Text>
            </Pressable>
          </View>
          <View style={styles.activityList}>
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

function createStyles(color: ReturnType<typeof useTheme>['color']) {
  return StyleSheet.create({
    headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headingCopy: { flex: 1 },
    greeting: { fontFamily: fontFamily.regular, fontSize: fontSize.body, color: color.textSecondary, ...textShadow },
    userName: { fontFamily: fontFamily.serif, fontSize: fontSize.headingLg, color: color.textPrimary, marginTop: spacing.xs },
    subtitle: { fontFamily: fontFamily.regular, fontSize: fontSize.body, color: color.textMuted, marginTop: spacing.sm, ...textShadow },
    statusSection: { marginTop: spacing.xl },
    statusHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.md },
    statusCopy: { flex: 1 },
    heroKicker: { fontFamily: fontFamily.serif, fontSize: fontSize.cardTitle + 2, color: color.textPrimary },
    projectName: { fontFamily: fontFamily.regular, fontSize: fontSize.body, color: color.textSecondary, marginTop: spacing.xs },
    statusLink: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: color.surfaceMuted },
    statusValue: { fontFamily: fontFamily.semibold, fontSize: fontSize.meta, textTransform: 'uppercase' },
    phaseRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg },
    phaseChips: { flexDirection: 'row', gap: 5 },
    phaseChip: { width: 20, height: 6, borderRadius: 3, backgroundColor: color.surfaceMuted },
    phaseChipActive: { backgroundColor: color.accent },
    phaseText: { flex: 1, fontFamily: fontFamily.semibold, fontSize: fontSize.meta, color: color.textPrimary },
    dateRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, marginTop: spacing.xl, paddingTop: spacing.lg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.border },
    dateText: { flex: 1, fontFamily: fontFamily.regular, fontSize: fontSize.caption, color: color.textMuted },
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
    activityList: { gap: spacing.xs },
    pressed: { opacity: 0.62 },
  });
}
