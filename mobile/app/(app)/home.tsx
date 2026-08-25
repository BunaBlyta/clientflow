import { useRouter } from 'expo-router';
import { ArrowUpRight, CircleDollarSign, FolderKanban, MessageSquare } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect } from 'react';
import { EmptyState } from '../../components/ui/EmptyState';
import { Screen } from '../../components/ui/Screen';
import { formatCurrency, formatDate } from '../../lib/format';
import { getInvoiceStatusMeta, getProjectStatusLabel, getProjectStatusMeta, PROJECT_STAGES } from '../../lib/status';
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
  const paidTotal = invoices
    .filter((invoice) => invoice.status === 'PAID')
    .reduce((sum, invoice) => sum + invoice.amountCents, 0);
  const outstandingTotal = invoices
    .filter((invoice) => invoice.status === 'SENT' || invoice.status === 'FAILED' || invoice.status === 'PAYMENT_PENDING')
    .reduce((sum, invoice) => sum + invoice.amountCents, 0);
  const payableInvoice = invoices.find((invoice) => invoice.status === 'SENT' || invoice.status === 'FAILED');
  const nextAction = payableInvoice
    ? {
        icon: CircleDollarSign,
        label: payableInvoice.status === 'FAILED' ? t('invoices.retryPayment') : t('invoices.payNow'),
        detail: `${payableInvoice.label} · ${formatCurrency(payableInvoice.amountCents)}`,
        onPress: () => projectNavigation.openInvoice(payableInvoice.projectId, payableInvoice.id, 'home'),
      }
    : project
      ? {
          icon: MessageSquare,
          label: t('projects.notes'),
          detail: t('notes.writeNote'),
          onPress: () => projectNavigation.openNotes(project.id, 'home'),
        }
      : null;

  return (
    <Screen>
      <View style={styles.headingRow}>
        <View style={styles.headingCopy}>
          <Text style={styles.greeting}>{t('home.goodAfternoon')}</Text>
          <Text style={styles.userName}>{client?.name?.split(' ')[0] ?? t('projects.greeting')}</Text>
          <Text style={styles.subtitle}>{client?.companyName ?? t('projects.greeting')}</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{client?.name?.charAt(0).toUpperCase() ?? '?'}</Text>
        </View>
      </View>

      {!project ? (
        <EmptyState icon={FolderKanban} title={t('projects.emptyTitle')} subtitle={t('projects.emptySubtitle')} />
      ) : (
        <>
          <Card tone="glow" style={styles.statusSection}>
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
              <Text style={styles.phaseText}>{getProjectStatusLabel(project.status, t)} phase</Text>
              <Text style={styles.phaseText}>{Math.round(Math.max(8, ((PROJECT_STAGES.indexOf(project.status) + 1) / PROJECT_STAGES.length) * 100))}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.max(8, ((PROJECT_STAGES.indexOf(project.status) + 1) / PROJECT_STAGES.length) * 100)}%`,
                    backgroundColor: getProjectStatusMeta(project.status, color, t).text,
                  },
                ]}
              />
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
            <View style={styles.stat}>
              <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
                {formatCurrency(paidTotal)}
              </Text>
              <Text style={styles.statLabel}>{t('projects.paidToDate')}</Text>
            </View>
            <View style={styles.stat}>
              <Text
                style={[styles.statValue, outstandingTotal > 0 && styles.statValueWarning]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatCurrency(outstandingTotal)}
              </Text>
              <Text style={styles.statLabel}>{t('projects.outstanding')}</Text>
            </View>
          </View>

          <View style={styles.bentoRow}>
            {nextAction && (
              <Card tone="accent" style={styles.actionCard} padding={14}>
                <Pressable
                  onPress={nextAction.onPress}
                  style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
                >
                  <View style={styles.actionIcon}>
                    <nextAction.icon size={18} color={color.accentText} />
                  </View>
                  <Text style={styles.actionLabel} numberOfLines={1}>{nextAction.label}</Text>
                  <Text style={styles.actionDetail} numberOfLines={1}>{nextAction.detail}</Text>
                  <View style={styles.actionArrow}>
                    <ArrowUpRight size={15} color={color.accentText} />
                  </View>
                </Pressable>
              </Card>
            )}

            <Card tone="dark" style={styles.summaryCard} padding={14}>
              <Pressable
                onPress={() => router.push('/invoices')}
                style={({ pressed }) => [styles.summaryPressable, pressed && styles.pressed]}
              >
                <Text style={styles.sectionLabel}>{t('projects.invoices')}</Text>
                <Text style={styles.summaryText} numberOfLines={1} adjustsFontSizeToFit>
                  {t('projects.invoiceCount', { count: invoices.length })}
                </Text>
                {invoices[0] && (
                  <Text style={[styles.summaryStatus, { color: getInvoiceStatusMeta(invoices[0].status, color, t).text }]}>
                    {getInvoiceStatusMeta(invoices[0].status, color, t).label}
                  </Text>
                )}
              </Pressable>
            </Card>
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
    headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.lg },
    headingCopy: { flex: 1 },
    greeting: { fontFamily: fontFamily.regular, fontSize: fontSize.sectionTitle, color: color.textSecondary, ...textShadow },
    userName: { fontFamily: fontFamily.bold, fontSize: fontSize.headingLg, color: color.textPrimary, marginTop: spacing.xs },
    subtitle: { fontFamily: fontFamily.regular, fontSize: fontSize.body, color: color.textMuted, marginTop: spacing.sm, ...textShadow },
    avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: color.accentSoft, alignItems: 'center', justifyContent: 'center', marginLeft: spacing.md },
    avatarText: { fontFamily: fontFamily.semibold, fontSize: fontSize.cardTitle, color: color.accentText },
    statusSection: { marginTop: spacing.xxl },
    statusHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.md },
    statusCopy: { flex: 1 },
    heroKicker: { fontFamily: fontFamily.semibold, fontSize: fontSize.cardTitle, color: color.textPrimary },
    projectName: { fontFamily: fontFamily.regular, fontSize: fontSize.body, color: color.textSecondary, marginTop: spacing.xs },
    statusLink: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: color.surfaceMuted },
    statusValue: { fontFamily: fontFamily.semibold, fontSize: fontSize.meta, textTransform: 'uppercase' },
    phaseRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xl },
    phaseText: { fontFamily: fontFamily.medium, fontSize: fontSize.body, color: color.textSecondary },
    progressTrack: { height: spacing.md, borderRadius: spacing.md / 2, backgroundColor: color.surfaceMuted, marginTop: spacing.sm, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: spacing.xs / 2 },
    dateRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, marginTop: spacing.xl, paddingTop: spacing.lg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.border },
    dateText: { flex: 1, fontFamily: fontFamily.regular, fontSize: fontSize.caption, color: color.textMuted },
    detailsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: spacing.xs, marginTop: spacing.lg },
    detailsText: { fontFamily: fontFamily.semibold, fontSize: fontSize.cardTitle, color: color.accent },
    statsRow: { flexDirection: 'row', alignItems: 'stretch', gap: spacing.lg, marginTop: spacing.lg },
    stat: { flex: 1, padding: spacing.lg, minHeight: 128, borderRadius: radius.lg, backgroundColor: color.surfaceMuted },
    statValue: { fontFamily: fontFamily.bold, fontSize: fontSize.heading, color: color.textPrimary },
    statValueWarning: { color: color.warning },
    statLabel: { fontFamily: fontFamily.regular, fontSize: fontSize.meta, color: color.textSecondary, marginTop: spacing.sm },
    bentoRow: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.xl },
    sectionLabel: { fontFamily: fontFamily.semibold, fontSize: fontSize.meta, color: color.textMuted, textTransform: 'uppercase', letterSpacing: 1.4 },
    actionCard: { flex: 1 },
    actionRow: { flex: 1, gap: spacing.sm },
    actionIcon: { width: 34, height: 34, borderRadius: radius.md, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' },
    actionArrow: { position: 'absolute', top: 0, right: 0, width: 26, height: 26, borderRadius: radius.pill, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' },
    actionLabel: { fontFamily: fontFamily.semibold, fontSize: fontSize.cardTitle, color: color.textPrimary, marginTop: spacing.sm },
    actionDetail: { fontFamily: fontFamily.regular, fontSize: fontSize.meta, color: color.accentText },
    summaryCard: { flex: 1 },
    summaryPressable: { flex: 1, gap: spacing.sm, justifyContent: 'space-between' },
    summaryText: { fontFamily: fontFamily.bold, fontSize: fontSize.headingLg, color: color.textPrimary },
    summaryStatus: { fontFamily: fontFamily.medium, fontSize: fontSize.meta },
    activityHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xxl, marginBottom: spacing.sm },
    activityTitle: { fontFamily: fontFamily.semibold, fontSize: fontSize.sectionTitle, color: color.textPrimary },
    activityLink: { fontFamily: fontFamily.semibold, fontSize: fontSize.cardTitle, color: color.accent },
    activityList: { gap: spacing.xs },
    pressed: { opacity: 0.62 },
  });
}
