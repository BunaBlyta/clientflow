import { useLocalSearchParams } from 'expo-router';
import { CircleHelp } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { AppBackButton } from '../../../components/OriginBackButton';
import { Screen } from '../../../components/ui/Screen';
import { fontFamily, fontSize, spacing, useTheme } from '../../../lib/theme';
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
          <CircleHelp size={16} color={color.textSecondary} strokeWidth={1.8} />
        </View>
        <Text style={styles.title}>{t('ui.helpSupport')}</Text>
      </View>
      <View style={styles.description}>
        <HelpSection styles={styles} title={t('ui.helpProjectTitle')} body={t('ui.helpProject')} />
        <HelpSection styles={styles} title={t('ui.helpPaymentsTitle')} body={t('ui.helpPayments')} />
        <HelpSection styles={styles} title={t('ui.helpNotificationsTitle')} body={t('ui.helpNotifications')} />
        <HelpSection styles={styles} title={t('ui.helpAccountTitle')} body={t('ui.helpAccount')} />
      </View>
    </Screen>
  );
}

function HelpSection({
  title,
  body,
  styles,
}: {
  title: string;
  body: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
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
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: color.surfaceMuted,
    },
    title: {
      fontFamily: fontFamily.serif,
      fontSize: fontSize.headingLg,
      color: color.textPrimary,
    },
    description: { marginTop: spacing.xl, gap: spacing.xl },
    section: { gap: spacing.xs },
    sectionTitle: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.body,
      color: color.textPrimary,
    },
    body: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.body,
      lineHeight: 21,
      color: color.textSecondary,
    },
  });
}
