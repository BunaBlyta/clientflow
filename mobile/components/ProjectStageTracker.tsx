import { CircleDot, Code2, Eye, PauseCircle, PencilRuler, Rocket, Search, XCircle } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { fontFamily, fontSize, radius, spacing, useTheme } from '../lib/theme';
import { getProjectStatusLabel, PROJECT_STAGES } from '../lib/status';
import { useI18n } from '../lib/i18n';
import type { ProjectStatus } from '../lib/types';
import type { LucideIcon } from 'lucide-react-native';

interface ProjectStageTrackerProps {
  status: ProjectStatus;
}

const PHASES = PROJECT_STAGES.slice(1);
const STAGE_ICONS: Record<string, LucideIcon> = {
  DISCOVERY: Search,
  DESIGN: PencilRuler,
  DEVELOPMENT: Code2,
  REVIEW: Eye,
  LAUNCHED: Rocket,
  PENDING: CircleDot,
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

  const currentIndex = status === 'PENDING' ? -1 : PHASES.indexOf(status);

  return (
    <View style={styles.phaseRow}>
      {PHASES.map((stage, index) => {
        const completed = index < currentIndex;
        const current = index === currentIndex;
        return (
          <View key={stage} style={styles.phaseItem}>
            <StageIndicator stage={stage} completed={completed} current={current} colors={color} styles={styles} />
            <Text style={[styles.label, current && styles.labelCurrent, !completed && !current && styles.labelFuture]}>
              {stage === 'LAUNCHED' ? 'Launch' : getProjectStatusLabel(stage, t)}
            </Text>
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
  const Icon = STAGE_ICONS[stage] ?? CircleDot;

  if (current) {
    return (
      <View style={styles.phaseDotCurrent}>
        <View style={styles.circleCurrent}>
          <Icon size={13} color={colors.accentText} strokeWidth={2.2} />
        </View>
      </View>
    );
  }

  if (!completed) {
    return (
      <View style={styles.phaseDotUpcoming}>
        <Icon size={13} color={colors.textMuted} strokeWidth={1.8} />
      </View>
    );
  }

  return (
    <View style={styles.phaseDotDone}>
      <Icon size={13} color={colors.textOnAccent} strokeWidth={2} />
    </View>
  );
}

function createStyles(color: ReturnType<typeof useTheme>['color']) {
  return StyleSheet.create({
    phaseRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      gap: spacing.xs,
    },
    phaseItem: {
      flex: 1,
      alignItems: 'center',
      minWidth: 0,
    },
    phaseDotDone: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: color.accent,
    },
    phaseDotCurrent: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: color.surface,
    },
    circleCurrent: {
      width: 30,
      height: 30,
      borderRadius: 15,
      borderWidth: 2,
      borderColor: color.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    phaseDotUpcoming: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: color.surfaceMuted,
    },
    label: {
      fontFamily: fontFamily.regular,
      fontSize: 9.5,
      color: color.textMuted,
      textAlign: 'center',
      marginTop: spacing.sm,
    },
    labelCurrent: {
      fontFamily: fontFamily.semibold,
      color: color.textPrimary,
    },
    labelFuture: {
      color: color.textMuted,
    },
    banner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      backgroundColor: color.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      overflow: 'hidden',
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
