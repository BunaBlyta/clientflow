import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDate } from '../lib/format';
import { getPackageById } from '../lib/mock-data';
import { getProjectStatusMeta } from '../lib/status';
import { fontFamily, fontSize, radius, spacing, useTheme } from '../lib/theme';
import { useI18n } from '../lib/i18n';
import type { Project } from '../lib/types';

interface ProjectCardProps {
  project: Project;
  onPress: () => void;
}

export function ProjectCard({ project, onPress }: ProjectCardProps) {
  const { color } = useTheme();
  const { t } = useI18n();
  const styles = createStyles(color);
  const pkg = getPackageById(project.packageId);
  const meta = getProjectStatusMeta(project.status, color, t);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={2}>
          {project.name}
        </Text>
        <ChevronRight size={18} color={color.textMuted} />
      </View>
      {pkg && <Text style={styles.packageName}>{pkg.name}</Text>}
      <View style={styles.footer}>
        <Text style={[styles.statusText, { color: meta.text }]}>{meta.label}</Text>
        {project.targetLaunchDate && project.status !== 'LAUNCHED' && (
          <Text style={styles.meta}>
            {t('common.target')}: {formatDate(project.targetLaunchDate)}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

function createStyles(color: ReturnType<typeof useTheme>['color']) {
  return StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: color.surface,
    shadowColor: color.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  pressed: {
    opacity: 0.78,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
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
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  meta: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.meta,
    color: color.textMuted,
  },
  statusText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.meta,
  },
  });
}
