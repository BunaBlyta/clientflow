import { Check, PauseCircle, XCircle } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { fontFamily, fontSize, spacing, useTheme } from '../lib/theme';
import { getProjectStatusLabel, PROJECT_STAGES } from '../lib/status';
import { useI18n } from '../lib/i18n';
import type { ProjectStatus } from '../lib/types';

interface ProjectStageTrackerProps {
  status: ProjectStatus;
}

export function ProjectStageTracker({ status }: ProjectStageTrackerProps) {
  const { color } = useTheme();
  const { t } = useI18n();
  const styles = createStyles(color);
  if (status === 'CANCELLED' || status === 'ON_HOLD') {
    const isCancelled = status === 'CANCELLED';
    const Icon = isCancelled ? XCircle : PauseCircle;
    const tint = isCancelled ? color.danger : color.warning;
    const bg = isCancelled ? color.dangerBg : color.warningBg;
    const border = isCancelled ? color.dangerBorder : color.warningBorder;
    return (
      <View style={[styles.banner, { backgroundColor: bg, borderColor: border }]}>
        <Icon size={18} color={tint} strokeWidth={2} />
        <Text style={[styles.bannerText, { color: tint }]}>
          {isCancelled
            ? t('status.cancelledDescription')
            : t('status.onHoldDescription')}
        </Text>
      </View>
    );
  }

  const currentIndex = PROJECT_STAGES.indexOf(status);

  return (
    <View>
      {PROJECT_STAGES.map((stage, index) => {
        const completed = index < currentIndex;
        const current = index === currentIndex;
        const isLast = index === PROJECT_STAGES.length - 1;

        return (
          <View key={stage} style={styles.row}>
            <View style={styles.indicatorColumn}>
              <View
                style={[
                  styles.circle,
                  completed && styles.circleCompleted,
                  current && styles.circleCurrent,
                  !completed && !current && styles.circleFuture,
                ]}
              >
                {(completed || current) && (
                  <Check
                    size={12}
                    color={color.textOnAccent}
                    strokeWidth={3}
                  />
                )}
              </View>
              {!isLast && (
                <View
                  style={[
                    styles.line,
                    (completed || current) ? styles.lineFilled : styles.lineEmpty,
                  ]}
                />
              )}
            </View>
            <View style={styles.labelColumn}>
              <Text
                style={[
                  styles.label,
                  current && styles.labelCurrent,
                  !completed && !current && styles.labelFuture,
                ]}
              >
                {getProjectStatusLabel(stage, t)}
              </Text>
              {current && (
                <Text style={styles.currentMeta}>{t('status.inProgress')}</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const CIRCLE_SIZE = 22;

function createStyles(color: ReturnType<typeof useTheme>['color']) {
  return StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  indicatorColumn: {
    alignItems: 'center',
    width: CIRCLE_SIZE,
    marginRight: spacing.md,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleCompleted: {
    backgroundColor: color.textSecondary,
  },
  circleCurrent: {
    backgroundColor: color.accent,
  },
  circleFuture: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.borderStrong,
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: 24,
  },
  lineFilled: {
    backgroundColor: color.textSecondary,
  },
  lineEmpty: {
    backgroundColor: color.border,
  },
  labelColumn: {
    paddingBottom: spacing.lg,
    paddingTop: 2,
    flex: 1,
  },
  label: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.body,
    color: color.textSecondary,
  },
  labelCurrent: {
    fontFamily: fontFamily.medium,
    color: color.accentPressed,
  },
  labelFuture: {
    color: color.textMuted,
  },
  currentMeta: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.meta,
    color: color.textMuted,
    marginTop: 2,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
  },
  bannerText: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.caption,
    lineHeight: 18,
  },
  });
}
