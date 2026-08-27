import { useLocalSearchParams } from 'expo-router';
import { CircleHelp } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { AppBackButton } from '../../../components/OriginBackButton';
import { Screen } from '../../../components/ui/Screen';
import { fontFamily, fontSize, radius, spacing, useTheme } from '../../../lib/theme';
import { useI18n } from '../../../lib/i18n';

export default function HelpSupportScreen() {
  const { source } = useLocalSearchParams<{ source?: string }>();
  const { color } = useTheme();
  const { t } = useI18n();
  const styles = createStyles(color);

  return (
    <Screen>
      <AppBackButton source={source} accessibilityLabel={t('common.back')} />
      <View style={styles.titleRow}>
        <View style={styles.iconWrap}>
          <CircleHelp size={fontSize.headingLg} color={color.accent} strokeWidth={1.8} />
        </View>
        <Text style={styles.title}>{t('ui.helpSupport')}</Text>
      </View>
      <View style={styles.description}>
        <Text style={styles.body}>{t('ui.helpProject')}</Text>
        <Text style={styles.body}>{t('ui.helpAccount')} {t('ui.helpResources')}</Text>
      </View>
    </Screen>
  );
}

function createStyles(color: ReturnType<typeof useTheme>['color']) {
  return StyleSheet.create({
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    iconWrap: {
      padding: spacing.xs,
      borderRadius: radius.sm,
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
  });
}
