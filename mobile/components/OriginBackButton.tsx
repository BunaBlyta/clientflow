import { useNavigation, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useCallback, useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text } from 'react-native';
import { fontFamily, fontSize, spacing, useTheme } from '../lib/theme';
import { useI18n } from '../lib/i18n';

type Origin = 'invoices' | 'notifications';

export function useOriginBack(source?: string) {
  const router = useRouter();
  const navigation = useNavigation();
  const { color } = useTheme();
  const { t } = useI18n();
  const exitProgress = useRef(new Animated.Value(0)).current;
  const exiting = useRef(false);
  const origin: Origin | null = source === 'invoices' || source === 'notifications' ? source : null;
  const target = origin === 'invoices' ? '/invoices' : origin === 'notifications' ? '/notifications' : null;
  const label = origin === 'invoices' ? t('tabs.invoices') : origin === 'notifications' ? t('tabs.notifications') : '';

  const goToOrigin = useCallback(() => {
    if (!target || exiting.current) return;
    exiting.current = true;
    Animated.timing(exitProgress, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start(({ finished }) => {
      if (finished) router.replace(target);
      else exiting.current = false;
    });
  }, [exitProgress, router, target]);

  useEffect(() => {
    navigation.setOptions({
      headerBackVisible: !target,
      headerLeft: target
        ? () => <OriginBackButton color={color.textPrimary} label={label} onPress={goToOrigin} />
        : undefined,
    });

    return () => {
      navigation.setOptions({ headerBackVisible: true, headerLeft: undefined });
    };
  }, [color.textPrimary, goToOrigin, label, navigation, target]);

  return {
    exitStyle: {
      opacity: exitProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
      transform: [{ translateX: exitProgress.interpolate({ inputRange: [0, 1], outputRange: [0, -24] }) }],
    },
  };
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
