import { useRouter } from 'expo-router';
import { ArrowUpRight, CircleDollarSign, FolderKanban, MessageSquare } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect } from 'react';
import { ProjectStageTracker } from '../../components/ProjectStageTracker';
import { EmptyState } from '../../components/ui/EmptyState';
import { Screen } from '../../components/ui/Screen';
import { formatCurrency } from '../../lib/format';
import { getInvoiceStatusMeta } from '../../lib/status';
import { fontFamily, fontSize, radius, spacing, useTheme } from '../../lib/theme';
import { useI18n } from '../../lib/i18n';
import { useAuthStore } from '../../store/auth-store';
import { useDataStore } from '../../store/data-store';
import { useShallow } from 'zustand/react/shallow';

export default function HomeScreen() {
  const router = useRouter();
  const { color } = useTheme();
  const { t } = useI18n();
  const styles = createStyles(color);
  const client = useAuthStore((s) => s.client);
  const token = useAuthStore((s) => s.token);
  const projects = useDataStore(useShallow((s) => s.projects));
  const invoices = useDataStore(useShallow((s) => s.invoices.filter((invoice) => invoice.status !== 'DRAFT')));
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
        onPress: () => router.push(`/projects/${payableInvoice.projectId}/invoices/${payableInvoice.id}`),
      }
    : project
      ? {
          icon: MessageSquare,
          label: t('projects.notes'),
          detail: t('notes.writeNote'),
          onPress: () => router.push(`/projects/${project.id}/notes`),
        }
      : null;

  return (
    <Screen>
      <View style={styles.headingRow}>
        <View style={styles.headingCopy}>
          <Text style={styles.greeting}>
            {client ? `${t('projects.hi')}, ${client.name.split(' ')[0]}` : t('projects.greeting')}
          </Text>
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
          <View style={styles.hero}>
            <View style={styles.heroTopline}>
              <Text style={styles.heroKicker}>{t('projects.status')}</Text>
              <ArrowUpRight size={18} color={color.accentText} />
            </View>
            <Text style={styles.projectName} numberOfLines={2}>{project.name}</Text>
            <Pressable
              onPress={() => router.push(`/projects/${project.id}`)}
              style={({ pressed }) => [styles.trackerLink, pressed && styles.pressed]}
            >
              <View style={styles.trackerPanel}>
                <ProjectStageTracker status={project.status} />
              </View>
            </Pressable>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{formatCurrency(paidTotal)}</Text>
              <Text style={styles.statLabel}>{t('projects.paidToDate')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={[styles.statValue, outstandingTotal > 0 && styles.statValueWarning]}>
                {formatCurrency(outstandingTotal)}
              </Text>
              <Text style={styles.statLabel}>{t('projects.outstanding')}</Text>
            </View>
          </View>

          {nextAction && (
            <View style={styles.actionSection}>
              <Text style={styles.sectionLabel}>{t('home.nextAction')}</Text>
              <Pressable
                onPress={nextAction.onPress}
                style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
              >
                <View style={styles.actionIcon}>
                  <nextAction.icon size={18} color={color.accentText} />
                </View>
                <View style={styles.actionCopy}>
                  <Text style={styles.actionLabel}>{nextAction.label}</Text>
                  <Text style={styles.actionDetail} numberOfLines={1}>{nextAction.detail}</Text>
                </View>
                <ArrowUpRight size={17} color={color.textMuted} />
              </Pressable>
            </View>
          )}

          <View style={styles.summarySection}>
            <View style={styles.summaryHeading}>
              <Text style={styles.sectionLabel}>{t('projects.invoices')}</Text>
              <Pressable onPress={() => router.push('/invoices')} style={({ pressed }) => pressed && styles.pressed}>
                <Text style={styles.viewAll}>{t('common.viewAll')}</Text>
              </Pressable>
            </View>
            <View style={styles.summaryLine}>
              <Text style={styles.summaryText}>{t('projects.invoiceCount', { count: invoices.length })}</Text>
              {invoices[0] && (
                <Text style={[styles.summaryStatus, { color: getInvoiceStatusMeta(invoices[0].status, color, t).text }]}>
                  {getInvoiceStatusMeta(invoices[0].status, color, t).label}
                </Text>
              )}
            </View>
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
    greeting: { fontFamily: fontFamily.semibold, fontSize: 26, color: color.textPrimary },
    subtitle: { fontFamily: fontFamily.regular, fontSize: fontSize.body, color: color.textMuted, marginTop: spacing.xs },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: color.accentSoft, alignItems: 'center', justifyContent: 'center', marginLeft: spacing.md },
    avatarText: { fontFamily: fontFamily.semibold, fontSize: fontSize.cardTitle, color: color.accentText },
    hero: { marginTop: spacing.xxl, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: color.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: color.border },
    heroTopline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    heroKicker: { fontFamily: fontFamily.medium, fontSize: fontSize.meta, color: color.accentText, textTransform: 'uppercase', letterSpacing: 0.8 },
    projectName: { fontFamily: fontFamily.semibold, fontSize: fontSize.heading, color: color.textPrimary, marginTop: spacing.sm, marginBottom: spacing.lg },
    trackerLink: { marginHorizontal: -spacing.sm },
    trackerPanel: { backgroundColor: color.surfaceMuted, borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
    statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xl, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, backgroundColor: color.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: color.border, borderRadius: radius.lg },
    stat: { flex: 1 },
    statDivider: { width: StyleSheet.hairlineWidth, height: 32, backgroundColor: color.border },
    statValue: { fontFamily: fontFamily.semibold, fontSize: fontSize.sectionTitle, color: color.textPrimary },
    statValueWarning: { color: color.warning },
    statLabel: { fontFamily: fontFamily.regular, fontSize: fontSize.meta, color: color.textMuted, marginTop: spacing.xs },
    actionSection: { marginTop: spacing.xxl },
    sectionLabel: { fontFamily: fontFamily.medium, fontSize: fontSize.meta, color: color.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
    actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.border },
    actionIcon: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: color.accentSoft, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    actionCopy: { flex: 1 },
    actionLabel: { fontFamily: fontFamily.medium, fontSize: fontSize.body, color: color.textPrimary },
    actionDetail: { fontFamily: fontFamily.regular, fontSize: fontSize.caption, color: color.textMuted, marginTop: 2 },
    summarySection: { marginTop: spacing.xxl, paddingTop: spacing.lg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.border },
    summaryHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    viewAll: { fontFamily: fontFamily.medium, fontSize: fontSize.caption, color: color.accentText },
    summaryLine: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
    summaryText: { flex: 1, fontFamily: fontFamily.medium, fontSize: fontSize.body, color: color.textPrimary },
    summaryStatus: { fontFamily: fontFamily.medium, fontSize: fontSize.meta },
    pressed: { opacity: 0.62 },
  });
}
