import { useNavigation, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useCallback, useEffect } from 'react';
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

  // When a screen was opened from a tab (source is that tab), the swipe-back
  // gesture, the hardware back button, and any native header back must do the
  // same thing the in-app back button does — return to that tab. Left to its
  // default, the gesture just pops this screen's own stack, which can land the
  // user on a list they never opened (e.g. swiping back from a project they
  // reached from Home dumps them on the Projects list). Intercept the pop and
  // route it through goBack(). Only one AppBackButton is mounted per screen at
  // a time, so this listener is never registered twice.
  useEffect(() => {
    if (!origin) return;
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (event.data.action.type !== 'GO_BACK') return;
      event.preventDefault();
      goBack();
    });
    return unsubscribe;
  }, [navigation, origin, goBack]);

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
