import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronRight, FileText, MessageSquare } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NoteBubble } from '../../../../components/NoteBubble';
import { ProjectStageTracker } from '../../../../components/ProjectStageTracker';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { Screen } from '../../../../components/ui/Screen';
import { formatCurrency } from '../../../../lib/format';
import { getPackageById } from '../../../../lib/mock-data';
import { color, fontFamily, fontSize, spacing } from '../../../../lib/theme';
import { useDataStore } from '../../../../store/data-store';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const project = useDataStore((s) => s.projectById(id));
  const invoices = useDataStore((s) => s.invoicesForProject(id));
  const notes = useDataStore((s) => s.notesForProject(id));

  if (!project) {
    return (
      <Screen>
        <EmptyState icon={FileText} title="Project not found" />
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

  const recentNotes = notes.slice(-2);

  return (
    <Screen>
      <Stack.Screen options={{ title: project.name }} />

      <Text style={styles.name}>{project.name}</Text>
      {pkg && <Text style={styles.packageName}>{pkg.name}</Text>}

      <View style={styles.statRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{formatCurrency(paidTotal)}</Text>
          <Text style={styles.statLabel}>Paid to date</Text>
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
          <Text style={styles.statLabel}>Outstanding</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Status</Text>
      <ProjectStageTracker status={project.status} />

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <Pressable
          onPress={() => router.push(`/projects/${project.id}/notes`)}
          style={styles.viewAllRow}
        >
          <Text style={styles.viewAllText}>View all</Text>
          <ChevronRight size={14} color={color.accent} />
        </Pressable>
      </View>
      {recentNotes.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No notes yet" />
      ) : (
        recentNotes.map((note) => <NoteBubble key={note.id} note={note} />)
      )}

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Invoices</Text>
        <Pressable
          onPress={() => router.push(`/projects/${project.id}/invoices`)}
          style={styles.viewAllRow}
        >
          <Text style={styles.viewAllText}>View all</Text>
          <ChevronRight size={14} color={color.accent} />
        </Pressable>
      </View>
      {visibleInvoices.length === 0 ? (
        <EmptyState icon={FileText} title="No invoices yet" />
      ) : (
        <Text style={styles.invoiceSummary}>
          {visibleInvoices.length} invoice{visibleInvoices.length === 1 ? '' : 's'} on this project
        </Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
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
