import { useRouter } from 'expo-router';
import { ArrowUpRight, CircleDollarSign, FolderKanban, MessageSquare } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect } from 'react';
import { ProjectStageTracker } from '../../components/ProjectStageTracker';
import { CyanBackdrop } from '../../components/ui/CyanBackdrop';
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
      <Text style={styles.eyebrow}>CLIENTFLOW</Text>
      <Text style={styles.greeting}>
        {client ? `${t('projects.hi')}, ${client.name.split(' ')[0]}` : t('projects.greeting')}
      </Text>
      <Text style={styles.subtitle}>{client?.companyName ?? t('projects.greeting')}</Text>

      {!project ? (
        <EmptyState icon={FolderKanban} title={t('projects.emptyTitle')} subtitle={t('projects.emptySubtitle')} />
      ) : (
        <>
          <View style={styles.hero}>
            <CyanBackdrop />
            <View style={styles.heroTopline}>
              <Text style={styles.heroKicker}>{t('projects.status')}</Text>
              <ArrowUpRight size={18} color={color.accentText} />
            </View>
            <Text style={styles.projectName} numberOfLines={2}>{project.name}</Text>
            <Pressable
              onPress={() => router.push(`/projects/${project.id}`)}
              style={({ pressed }) => [styles.trackerLink, pressed && styles.pressed]}
            >
              <ProjectStageTracker status={project.status} />
            </Pressable>
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
    eyebrow: { fontFamily: fontFamily.medium, fontSize: fontSize.meta, letterSpacing: 1.6, color: color.accentText },
    greeting: { fontFamily: fontFamily.semibold, fontSize: 28, color: color.textPrimary, marginTop: spacing.sm },
    subtitle: { fontFamily: fontFamily.regular, fontSize: fontSize.body, color: color.textMuted, marginTop: spacing.xs },
    hero: { position: 'relative', overflow: 'hidden', marginTop: spacing.xxl, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: color.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: color.border },
    heroTopline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    heroKicker: { fontFamily: fontFamily.medium, fontSize: fontSize.meta, color: color.accentText, textTransform: 'uppercase', letterSpacing: 0.8 },
    projectName: { fontFamily: fontFamily.semibold, fontSize: fontSize.heading, color: color.textPrimary, marginTop: spacing.sm, marginBottom: spacing.lg },
    trackerLink: { marginHorizontal: -spacing.sm },
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
