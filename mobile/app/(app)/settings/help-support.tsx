import { CircleHelp } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { AppBackButton } from '../../../components/OriginBackButton';
import { Screen } from '../../../components/ui/Screen';
import { fontFamily, fontSize, radius, spacing, useTheme } from '../../../lib/theme';
import { useI18n } from '../../../lib/i18n';

export default function HelpSupportScreen() {
  const { color } = useTheme();
  const { t } = useI18n();
  const styles = createStyles(color);

  return (
    <Screen>
      <AppBackButton accessibilityLabel={t('common.back')} />
      <View style={styles.iconRow}>
        <View style={styles.iconWrap}>
          <CircleHelp size={22} color={color.accent} strokeWidth={1.8} />
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
    iconRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
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
  });
}
