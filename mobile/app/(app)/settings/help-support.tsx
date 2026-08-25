import { useRouter } from 'expo-router';
import { ArrowLeft, CircleHelp } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../../components/ui/Screen';
import { fontFamily, fontSize, radius, spacing, useTheme } from '../../../lib/theme';

export default function HelpSupportScreen() {
  const router = useRouter();
  const { color } = useTheme();
  const styles = createStyles(color);

  return (
    <Screen>
      <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
        <ArrowLeft size={20} color={color.textPrimary} strokeWidth={1.9} />
      </Pressable>
      <View style={styles.headingRow}>
        <View style={styles.iconWrap}>
          <CircleHelp size={22} color={color.accent} strokeWidth={1.8} />
        </View>
        <Text style={styles.title}>Help &amp; Support</Text>
      </View>
      <View style={styles.description}>
        <Text style={styles.body}>
          Need a hand with a project, invoice, or payment? Send a note from the project screen and the studio team will get back to you.
        </Text>
        <Text style={styles.body}>
          For account or access questions, contact your studio directly. This space will include more support resources as the client portal grows.
        </Text>
      </View>
    </Screen>
  );
}

function createStyles(color: ReturnType<typeof useTheme>['color']) {
  return StyleSheet.create({
    back: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: -spacing.sm,
      marginBottom: spacing.lg,
    },
    headingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: color.accentSoft,
    },
    title: {
      fontFamily: fontFamily.serif,
      fontSize: fontSize.headingLg,
      color: color.textPrimary,
    },
    description: { marginTop: spacing.xl, gap: spacing.lg },
    body: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.body,
      lineHeight: 21,
      color: color.textSecondary,
    },
    pressed: { opacity: 0.55 },
  });
}
