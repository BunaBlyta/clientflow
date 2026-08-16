import { ChevronRight, Circle } from 'lucide-react-native';
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

export function ProjectCard({ project, index, onPress }: ProjectCardProps) {
  const { color } = useTheme();
  const { t } = useI18n();
  const styles = createStyles(color);
  const pkg = getPackageById(project.packageId);
  const statusMeta = getProjectStatusMeta(project.status, color, t);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.projectMark}>
        <Text style={styles.projectMarkText}>{String(index + 1).padStart(2, '0')}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={2}>
            {project.name}
          </Text>
        </View>
        <View style={styles.metaRow}>
          {pkg && <Text style={styles.packageName}>{pkg.name}</Text>}
          <View style={styles.status}>
            <Circle size={6} color={statusMeta.text} fill={statusMeta.text} />
            <Text style={[styles.statusText, { color: statusMeta.text }]} numberOfLines={1}>{getProjectStatusLabel(project.status, t)}</Text>
          </View>
        </View>
      </View>
      <ChevronRight size={17} color={color.textMuted} />
    </Pressable>
  );
}

function createStyles(color: ReturnType<typeof useTheme>['color']) {
  return StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: color.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.border,
  },
  pressed: {
    opacity: 0.78,
  },
  header: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  content: {
    flex: 1,
  },
  projectMark: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: color.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  projectMarkText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.meta,
    color: color.textOnAccent,
    letterSpacing: 0.6,
  },
  name: {
    flex: 1,
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.cardTitle,
    color: color.textPrimary,
  },
  packageName: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.caption,
    color: color.textMuted,
    marginTop: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginLeft: 'auto',
  },
  statusText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.meta,
  },
  });
}
