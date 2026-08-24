import { useNavigation, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { fontFamily, fontSize, spacing, useTheme } from '../lib/theme';
import { useI18n } from '../lib/i18n';

type Origin = 'invoices' | 'notifications';

export function useOriginBack(source?: string) {
  const router = useRouter();
  const navigation = useNavigation();
  const { color } = useTheme();
  const { t } = useI18n();
  const redirecting = useRef(false);
  const origin: Origin | null = source === 'invoices' || source === 'notifications' ? source : null;
  const target = origin === 'invoices' ? '/invoices' : origin === 'notifications' ? '/notifications' : null;
  const label = origin === 'invoices' ? t('tabs.invoices') : origin === 'notifications' ? t('tabs.notifications') : '';

  const goToOrigin = useCallback(() => {
    if (target) {
      redirecting.current = true;
      router.replace(target);
    }
  }, [router, target]);

  useEffect(() => {
    const unsubscribe = target
      ? navigation.addListener('beforeRemove', (event) => {
          if (redirecting.current) return;
          event.preventDefault();
          goToOrigin();
        })
      : undefined;

    navigation.setOptions({
      headerBackVisible: !target,
      headerLeft: target
        ? () => <OriginBackButton color={color.textPrimary} label={label} onPress={goToOrigin} />
        : undefined,
    });

    return () => {
      unsubscribe?.();
      navigation.setOptions({ headerBackVisible: true, headerLeft: undefined });
    };
  }, [color.textPrimary, goToOrigin, label, navigation, redirecting, target]);
}

function OriginBackButton({ color, label, onPress }: { color: string; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={spacing.sm} style={styles.button}>
      <ArrowLeft size={20} color={color} strokeWidth={2} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.caption,
  },
});
