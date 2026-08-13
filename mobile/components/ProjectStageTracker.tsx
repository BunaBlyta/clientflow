import { Check, PauseCircle, XCircle } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { fontFamily, fontSize, radius, spacing, useTheme } from '../lib/theme';
import { getProjectStatusLabel, PROJECT_STAGES } from '../lib/status';
import { useI18n } from '../lib/i18n';
import type { ProjectStatus } from '../lib/types';

interface ProjectStageTrackerProps {
  status: ProjectStatus;
}

const CIRCLE_SIZE = 24;

export function ProjectStageTracker({ status }: ProjectStageTrackerProps) {
  const { color } = useTheme();
  const { t } = useI18n();
  const styles = createStyles(color);

  if (status === 'CANCELLED' || status === 'ON_HOLD') {
    const isCancelled = status === 'CANCELLED';
    const Icon = isCancelled ? XCircle : PauseCircle;
    const tint = isCancelled ? color.danger : color.warning;
    return (
      <View style={styles.banner}>
        <View style={[styles.bannerAccent, { backgroundColor: tint }]} />
        <Icon size={19} color={tint} strokeWidth={2} />
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
    <View style={styles.trackCard}>
      {PROJECT_STAGES.map((stage, index) => {
        const completed = index < currentIndex;
        const current = index === currentIndex;
        const isLast = index === PROJECT_STAGES.length - 1;

        return (
          <View key={stage} style={styles.row}>
            <View style={styles.indicatorColumn}>
              <StageIndicator
                stage={stage}
                completed={completed}
                current={current}
                colors={color}
                styles={styles}
              />
              {!isLast && (
                <View style={styles.lineTrack}>
                  <View
                    style={[
                      styles.lineFill,
                      (completed || current) && styles.lineFillActive,
                    ]}
                  />
                </View>
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

function StageIndicator({
  stage,
  completed,
  current,
  colors,
  styles,
}: {
  stage: ProjectStatus;
  completed: boolean;
  current: boolean;
  colors: ReturnType<typeof useTheme>['color'];
  styles: ReturnType<typeof createStyles>;
}) {
  if (!completed && !current) {
    return <View style={styles.circleFuture} />;
  }

  const gradientId = `stage-${stage.toLowerCase()}`;
  return (
    <View style={[styles.circleWrap, current && styles.circleCurrentGlow]}>
      <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} viewBox={`0 0 ${CIRCLE_SIZE} ${CIRCLE_SIZE}`}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.accentPressed} />
            <Stop offset="1" stopColor={colors.accent} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={CIRCLE_SIZE / 2}
          cy={CIRCLE_SIZE / 2}
          r={CIRCLE_SIZE / 2}
          fill={`url(#${gradientId})`}
        />
      </Svg>
      <Check
        size={12}
        color={colors.textOnAccent}
        strokeWidth={3}
        style={styles.circleIcon}
      />
    </View>
  );
}

function createStyles(color: ReturnType<typeof useTheme>['color']) {
  return StyleSheet.create({
    trackCard: {
      backgroundColor: color.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: color.border,
      borderRadius: radius.lg,
      padding: spacing.lg,
      shadowColor: color.shadow,
      shadowOpacity: 0.14,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
    },
    row: {
      flexDirection: 'row',
    },
    indicatorColumn: {
      alignItems: 'center',
      width: CIRCLE_SIZE,
      marginRight: spacing.md,
    },
    circleWrap: {
      width: CIRCLE_SIZE,
      height: CIRCLE_SIZE,
      alignItems: 'center',
      justifyContent: 'center',
    },
    circleCurrentGlow: {
      shadowColor: color.accent,
      shadowOpacity: 0.42,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 0 },
      elevation: 5,
    },
    circleIcon: {
      position: 'absolute',
    },
    circleFuture: {
      width: CIRCLE_SIZE,
      height: CIRCLE_SIZE,
      borderRadius: CIRCLE_SIZE / 2,
      backgroundColor: color.surfaceMuted,
      borderWidth: 1,
      borderColor: color.borderStrong,
    },
    lineTrack: {
      width: 4,
      flex: 1,
      minHeight: 24,
      marginVertical: 3,
      borderRadius: 2,
      backgroundColor: color.surfaceMuted,
      overflow: 'hidden',
    },
    lineFill: {
      flex: 1,
      backgroundColor: color.borderStrong,
    },
    lineFillActive: {
      backgroundColor: color.accent,
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
      fontFamily: fontFamily.semibold,
      color: color.textPrimary,
    },
    labelFuture: {
      color: color.textMuted,
    },
    currentMeta: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.meta,
      color: color.accentPressed,
      marginTop: 2,
    },
    banner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      backgroundColor: color.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: color.border,
      borderRadius: radius.lg,
      padding: spacing.md,
      overflow: 'hidden',
      shadowColor: color.shadow,
      shadowOpacity: 0.12,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 5 },
      elevation: 2,
    },
    bannerAccent: {
      width: 3,
      alignSelf: 'stretch',
      borderRadius: 2,
    },
    bannerText: {
      flex: 1,
      fontFamily: fontFamily.medium,
      fontSize: fontSize.caption,
      lineHeight: 18,
    },
  });
}
