import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getPackageById } from '../lib/mock-data';
import { fontFamily, fontSize, radius, spacing, useTheme } from '../lib/theme';
import { getProjectStatusLabel, getProjectStatusMeta } from '../lib/status';
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
  const stageIndex = ['PENDING', 'DISCOVERY', 'DESIGN', 'DEVELOPMENT', 'REVIEW', 'LAUNCHED'].indexOf(project.status);
  const progress = Math.max(8, ((stageIndex + 1) / 6) * 100);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.titleRow}>
        <Text style={styles.name} numberOfLines={2}>{project.name}</Text>
        <View style={[styles.statusPill, { backgroundColor: statusMeta.bg }]}>
          <Text style={[styles.statusText, { color: statusMeta.text }]} numberOfLines={1}>{getProjectStatusLabel(project.status, t)}</Text>
        </View>
      </View>
      {pkg && <Text style={styles.packageName}>{pkg.name}</Text>}
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
    name: { flex: 1, fontFamily: fontFamily.semibold, fontSize: fontSize.cardTitle, lineHeight: 21, color: color.textPrimary },
    packageName: { fontFamily: fontFamily.regular, fontSize: fontSize.body, color: color.textSecondary, marginTop: spacing.xs },
    statusPill: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
    statusText: { fontFamily: fontFamily.medium, fontSize: fontSize.meta, textTransform: 'uppercase', letterSpacing: 0.3 },
    progressTrack: { height: spacing.xs, borderRadius: spacing.xs / 2, backgroundColor: color.surfaceMuted, overflow: 'hidden', marginTop: spacing.xl },
    progressFill: { height: '100%', borderRadius: spacing.xs / 2 },
    dateRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, marginTop: spacing.lg },
    dateText: { flex: 1, fontFamily: fontFamily.regular, fontSize: fontSize.caption, color: color.textMuted },
    detailsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: spacing.xs, marginTop: spacing.lg },
    detailsText: { fontFamily: fontFamily.semibold, fontSize: fontSize.cardTitle, color: color.accent },
  });
}
