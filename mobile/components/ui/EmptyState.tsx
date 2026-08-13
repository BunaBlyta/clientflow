import { StyleSheet, Text, View } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { fontFamily, fontSize, spacing, useTheme } from '../../lib/theme';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon: Icon, title, subtitle }: EmptyStateProps) {
  const { color } = useTheme();
  const styles = createStyles(color);
  return (
    <View style={styles.container}>
      <Icon size={28} color={color.textMuted} strokeWidth={1.5} />
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function createStyles(color: ReturnType<typeof useTheme>['color']) {
  return StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  title: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.body,
    color: color.textSecondary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.caption,
    color: color.textMuted,
    textAlign: 'center',
  },
  });
}
