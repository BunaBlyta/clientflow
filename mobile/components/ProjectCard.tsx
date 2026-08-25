import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getPackageById } from '../lib/mock-data';
import { fontFamily, fontSize, radius, spacing, useTheme } from '../lib/theme';
import { getProjectStatusLabel, getProjectStatusMeta, PROJECT_STAGES } from '../lib/status';
import { useI18n } from '../lib/i18n';
import type { Project } from '../lib/types';

interface ProjectCardProps {
  project: Project;
  index: number;
  onPress: () => void;
}

export function ProjectCard({ project, onPress }: ProjectCardProps) {
  const { color } = useTheme();
  const { t } = useI18n();
  const styles = createStyles(color);
  const pkg = getPackageById(project.packageId);
  const statusMeta = getProjectStatusMeta(project.status, color, t);
  const stageIndex = PROJECT_STAGES.indexOf(project.status);
  const progress = Math.max(0, (stageIndex / (PROJECT_STAGES.length - 1)) * 100);
  const progressLabel = project.status === 'LAUNCHED'
    ? 'Delivered'
    : `${getProjectStatusLabel(project.status, t)} phase`;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.titleRow}>
        <Text style={styles.name} numberOfLines={2}>{project.name}</Text>
        <View style={[styles.statusPill, { backgroundColor: statusMeta.bg }]}>
          <Text style={[styles.statusText, { color: statusMeta.text }]} numberOfLines={1}>{getProjectStatusLabel(project.status, t)}</Text>
        </View>
      </View>
      {pkg && <Text style={styles.packageName}>{pkg.name}</Text>}
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>{progressLabel}</Text>
        <Text style={styles.progressLabel}>{Math.round(progress)}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: statusMeta.text }]} />
      </View>
      <View style={styles.dateRow}>
        <Text style={styles.dateText}>Started {formatProjectDate(project.createdAt)}</Text>
        <Text style={styles.dateText}>{project.targetLaunchDate ? `Est. launch ${formatProjectDate(project.targetLaunchDate)}` : 'Not scheduled'}</Text>
      </View>
      <View style={styles.detailsRow}>
        <Text style={styles.detailsText}>View details</Text>
        <ChevronRight size={18} color={color.accent} />
      </View>
    </Pressable>
  );
}

function formatProjectDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function createStyles(color: ReturnType<typeof useTheme>['color']) {
  return StyleSheet.create({
    row: { padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: color.border, borderRadius: radius.lg, backgroundColor: color.surface },
    pressed: { opacity: 0.7 },
    titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
    name: { flex: 1, fontFamily: fontFamily.serif, fontSize: fontSize.cardTitle + 2, lineHeight: 21, color: color.textPrimary },
    packageName: { fontFamily: fontFamily.regular, fontSize: fontSize.caption, color: color.textSecondary, marginTop: spacing.xs },
    statusPill: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
    statusText: { fontFamily: fontFamily.medium, fontSize: fontSize.meta, textTransform: 'uppercase', letterSpacing: 0.3 },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg, marginBottom: spacing.sm },
    progressLabel: { fontFamily: fontFamily.medium, fontSize: fontSize.meta, color: color.textSecondary },
    progressTrack: { height: 7, borderRadius: 4, backgroundColor: color.surfaceMuted, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: spacing.xs / 2 },
    dateRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, marginTop: spacing.lg, paddingTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.border },
    dateText: { flex: 1, fontFamily: fontFamily.regular, fontSize: fontSize.meta, color: color.textMuted },
    detailsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: spacing.xs, marginTop: spacing.md },
    detailsText: { fontFamily: fontFamily.semibold, fontSize: fontSize.meta, color: color.accent },
  });
}
