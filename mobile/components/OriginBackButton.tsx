import { useNavigation, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useCallback } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { spacing, useTheme } from '../lib/theme';

type Origin = 'home' | 'invoices' | 'notifications' | 'account';

export function useOriginBack(source?: string) {
  const router = useRouter();
  const navigation = useNavigation();
  const origin: Origin | null =
    source === 'home' || source === 'invoices' || source === 'notifications' || source === 'account'
      ? source
      : null;
  const target = origin ? `/${origin}` as const : null;

  const goBack = useCallback(() => {
    if (origin && target) {
      const tabs = navigation.getParent() as
        | { navigate: (routeName: Origin) => void }
        | undefined;
      if (tabs) {
        tabs.navigate(origin);
        return;
      }
      router.replace(target);
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    router.back();
  }, [navigation, origin, router, target]);

  return { goBack };
}

export function AppBackButton({
  source,
  accessibilityLabel,
}: {
  source?: string;
  accessibilityLabel: string;
}) {
  const { color } = useTheme();
  const { goBack } = useOriginBack(source);

  return (
    <Pressable
      onPress={goBack}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={spacing.sm}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <ArrowLeft size={21} color={color.textPrimary} strokeWidth={1.9} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginLeft: -spacing.sm,
    marginBottom: spacing.sm,
  },
  pressed: {
    opacity: 0.45,
  },
});
