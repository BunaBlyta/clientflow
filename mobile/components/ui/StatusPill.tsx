import { StyleSheet, Text, View } from 'react-native';
import { fontFamily, fontSize, radius, spacing } from '../../lib/theme';

interface StatusPillProps {
  label: string;
  text: string;
  bg: string;
  border: string;
}

export function StatusPill({ label, text, bg, border }: StatusPillProps) {
  return (
    <View style={[styles.pill, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.meta,
  },
});
