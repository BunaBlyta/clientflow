import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { fontSize, radius, spacing, useTheme } from '../../lib/theme';

// One shared pulse so every skeleton on screen breathes in unison rather than
// each block drifting on its own phase. Subtle by design (opacity 1 -> 0.45,
// ~900ms each way) to match the "fast and subtle only" motion rule.
function usePulse() {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(value, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [value]);
  return value.interpolate({ inputRange: [0, 1], outputRange: [1, 0.45] });
}

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({ width = '100%', height = 12, radius: r = 6, style }: SkeletonProps) {
  const { color } = useTheme();
  const opacity = usePulse();
  return (
    <Animated.View
      style={[
        { width, height, borderRadius: r, backgroundColor: color.surfaceMuted, opacity },
        style,
      ]}
    />
  );
}

// A stack of line skeletons; the last line is shortened so it reads as text.
export function SkeletonText({
  lines = 3,
  gap = spacing.sm,
  lineHeight = fontSize.body,
  lastWidth = '60%',
}: {
  lines?: number;
  gap?: number;
  lineHeight?: number;
  lastWidth?: DimensionValue;
}) {
  return (
    <View style={{ gap }}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height={lineHeight}
          width={index === lines - 1 && lines > 1 ? lastWidth : '100%'}
        />
      ))}
    </View>
  );
}

function useCardStyle(): ViewStyle {
  const { color } = useTheme();
  return {
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.lg,
    backgroundColor: color.surface,
    padding: spacing.lg,
  };
}

export function ProjectCardSkeleton() {
  const cardStyle = useCardStyle();
  return (
    <View style={[cardStyle, { marginBottom: spacing.lg }]}>
      <View style={styles.rowBetween}>
        <Skeleton width="55%" height={16} />
        <Skeleton width={72} height={20} radius={radius.pill} />
      </View>
      <Skeleton width="35%" height={11} style={{ marginTop: spacing.sm }} />
      <View style={[styles.rowBetween, { marginTop: spacing.lg }]}>
        <Skeleton width={90} height={11} />
        <Skeleton width={32} height={11} />
      </View>
      <Skeleton height={7} radius={4} style={{ marginTop: spacing.sm }} />
      <View style={[styles.rowBetween, { marginTop: spacing.lg }]}>
        <Skeleton width="40%" height={11} />
        <Skeleton width="40%" height={11} />
      </View>
    </View>
  );
}

export function InvoiceRowSkeleton() {
  const { color } = useTheme();
  return (
    <View style={[styles.invoiceRow, { backgroundColor: color.surfaceSage }]}>
      <View style={styles.left}>
        <Skeleton width="70%" height={14} />
        <Skeleton width="40%" height={11} style={{ marginTop: spacing.sm }} />
        <Skeleton width="50%" height={13} style={{ marginTop: spacing.sm }} />
      </View>
      <View style={styles.rightCol}>
        <Skeleton width={52} height={11} />
        <Skeleton width={76} height={30} radius={radius.md} style={{ marginTop: spacing.sm }} />
      </View>
    </View>
  );
}

export function NotificationRowSkeleton() {
  return (
    <View style={styles.notificationRow}>
      <Skeleton width={34} height={34} radius={radius.md} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Skeleton width="65%" height={13} />
        <Skeleton width="90%" height={11} style={{ marginTop: spacing.sm }} />
      </View>
    </View>
  );
}

export function NoteBubbleSkeleton({ mine = false }: { mine?: boolean }) {
  const { color } = useTheme();
  return (
    <View style={[styles.noteRow, { alignItems: mine ? 'flex-end' : 'flex-start' }]}>
      <View
        style={{
          width: mine ? '58%' : '72%',
          borderRadius: radius.lg,
          padding: spacing.md,
          backgroundColor: mine ? color.accentSoft : color.surface,
          borderWidth: mine ? 0 : 1,
          borderColor: color.border,
          gap: spacing.sm,
        }}
      >
        <Skeleton width="90%" height={12} />
        <Skeleton width="55%" height={12} />
      </View>
    </View>
  );
}

export function KpiCardSkeleton() {
  const { color } = useTheme();
  return (
    <View style={[styles.kpiCard, { backgroundColor: color.surfaceMuted }]}>
      <Skeleton width="60%" height={10} />
      <Skeleton width="80%" height={20} style={{ marginTop: spacing.md }} />
      <Skeleton width="50%" height={10} style={{ marginTop: spacing.sm }} />
    </View>
  );
}

const styles = StyleSheet.create({
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  invoiceRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  left: { flex: 1, minWidth: 0 },
  rightCol: { alignItems: 'flex-end', justifyContent: 'center' },
  notificationRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  noteRow: {
    marginBottom: spacing.md,
  },
  kpiCard: {
    flex: 1,
    padding: 12,
    borderRadius: radius.md,
  },
});
