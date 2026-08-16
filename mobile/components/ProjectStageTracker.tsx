import { Check, CircleDot, Code2, Eye, PauseCircle, PencilRuler, Rocket, Search, XCircle } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { fontFamily, fontSize, radius, spacing, useTheme } from '../lib/theme';
import { getProjectStatusLabel, PROJECT_STAGES } from '../lib/status';
import { useI18n } from '../lib/i18n';
import type { ProjectStatus } from '../lib/types';
import type { LucideIcon } from 'lucide-react-native';

interface ProjectStageTrackerProps {
  status: ProjectStatus;
}

const INDICATOR_SIZE = 32;
const CIRCLE_SIZE = 24;
const CHECK_SIZE = 12;
const FUTURE_DOT_SIZE = 8;
const LABEL_SLOT_HEIGHT = 40;
const STAGE_ICONS: Record<string, LucideIcon> = {
  PENDING: CircleDot,
  DISCOVERY: Search,
  DESIGN: PencilRuler,
  DEVELOPMENT: Code2,
  REVIEW: Eye,
  LAUNCHED: Rocket,
};

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
  const progress = currentIndex / (PROJECT_STAGES.length - 1);

  return (
    <View style={styles.trackCard}>
      <View style={styles.timeline}>
        <View style={styles.lineTrack}>
          <View style={[styles.lineFill, { width: `${progress * 100}%` }]} />
        </View>
        <View style={styles.stageRow}>
          {PROJECT_STAGES.map((stage, index) => {
            const completed = index < currentIndex;
            const current = index === currentIndex;
            const label = (
              <View style={styles.labelSlot}>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                  style={[
                    styles.label,
                    current && styles.labelCurrent,
                    !completed && !current && styles.labelFuture,
                  ]}
                >
                  {getProjectStatusLabel(stage, t)}
                </Text>
              </View>
            );

            return (
              <View key={stage} style={styles.stageItem}>
                {index % 2 === 0 ? label : <View style={styles.labelSlot} />}
                <StageIndicator
                  stage={stage}
                  completed={completed}
                  current={current}
                  colors={color}
                  styles={styles}
                />
                {index % 2 === 1 ? label : <View style={styles.labelSlot} />}
              </View>
            );
          })}
        </View>
        <Text style={styles.currentMeta}>{t('status.inProgress')}</Text>
      </View>
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
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!current) return;
    pulse.setValue(0);
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [current, pulse]);

  if (current) {
    const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] });
    const ringOpacity = pulse.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.5, 0.28, 0] });
    const Icon = STAGE_ICONS[stage] ?? CircleDot;

    return (
      <View style={styles.circleWrap}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.pulseRing,
            { opacity: ringOpacity, transform: [{ scale: ringScale }] },
          ]}
        />
        <View style={styles.circleCurrent}>
          <Icon size={13} color={colors.accentText} strokeWidth={2.2} />
        </View>
      </View>
    );
  }

  if (!completed) {
    return (
      <View style={styles.circleWrap}>
        <View style={styles.circleFuture} />
      </View>
    );
  }

  const gradientId = `stage-${stage.toLowerCase()}`;
  return (
    <View style={styles.circleWrap}>
      <Svg width={INDICATOR_SIZE} height={INDICATOR_SIZE} viewBox={`0 0 ${INDICATOR_SIZE} ${INDICATOR_SIZE}`}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.accentPressed} />
            <Stop offset="1" stopColor={colors.accent} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={INDICATOR_SIZE / 2}
          cy={INDICATOR_SIZE / 2}
          r={CIRCLE_SIZE / 2}
          fill={`url(#${gradientId})`}
        />
      </Svg>
      <Check size={CHECK_SIZE} color={colors.textOnAccent} strokeWidth={3} style={styles.circleIcon} />
    </View>
  );
}

function createStyles(color: ReturnType<typeof useTheme>['color']) {
  return StyleSheet.create({
    trackCard: {
      paddingVertical: spacing.xs,
      width: '100%',
    },
    timeline: {
      position: 'relative',
    },
    stageRow: {
      flexDirection: 'row',
    },
    stageItem: {
      flex: 1,
      alignItems: 'center',
      minWidth: 0,
      zIndex: 1,
    },
    labelSlot: {
      width: '100%',
      height: LABEL_SLOT_HEIGHT,
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 2,
      paddingVertical: 2,
    },
    circleWrap: {
      width: INDICATOR_SIZE,
      height: INDICATOR_SIZE,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
    },
    circleIcon: {
      position: 'absolute',
      left: (INDICATOR_SIZE - CHECK_SIZE) / 2,
      top: (INDICATOR_SIZE - CHECK_SIZE) / 2,
    },
    circleFuture: {
      width: FUTURE_DOT_SIZE,
      height: FUTURE_DOT_SIZE,
      borderRadius: FUTURE_DOT_SIZE / 2,
      backgroundColor: color.background,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: color.borderStrong,
    },
    pulseRing: {
      position: 'absolute',
      width: INDICATOR_SIZE,
      height: INDICATOR_SIZE,
      borderRadius: INDICATOR_SIZE / 2,
      backgroundColor: color.accent,
    },
    circleCurrent: {
      width: CIRCLE_SIZE,
      height: CIRCLE_SIZE,
      borderRadius: CIRCLE_SIZE / 2,
      borderWidth: 2,
      borderColor: color.accent,
      backgroundColor: color.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    lineTrack: {
      position: 'absolute',
      top: LABEL_SLOT_HEIGHT + INDICATOR_SIZE / 2 - 1,
      left: INDICATOR_SIZE / 2,
      right: INDICATOR_SIZE / 2,
      height: 2,
      borderRadius: 1,
      backgroundColor: color.border,
    },
    lineFill: {
      height: 2,
      backgroundColor: color.accent,
    },
    label: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.meta,
      color: color.textSecondary,
      textAlign: 'center',
      lineHeight: 14,
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
      fontSize: fontSize.caption,
      color: color.accentPressed,
      textAlign: 'center',
      lineHeight: 17,
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
      shadowOpacity: 0.06,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 },
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
