import { useCallback, useRef, type PropsWithChildren } from 'react';
import { Animated, Easing, Platform, ScrollView, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, useTheme } from '../../lib/theme';
import { CyanBackdrop } from './CyanBackdrop';

interface ScreenProps extends PropsWithChildren {
  scroll?: boolean;
  backdrop?: boolean;
  tabTransition?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: ViewStyle;
}

const AnimatedSafeAreaView = Animated.createAnimatedComponent(SafeAreaView);

export function Screen({
  children,
  scroll = true,
  backdrop = false,
  tabTransition = false,
  style,
  contentContainerStyle,
}: ScreenProps) {
  const { color } = useTheme();
  const insets = useSafeAreaInsets();
  const tabProgress = useRef(new Animated.Value(tabTransition ? 0 : 1)).current;
  const styles = createStyles(color);
  useFocusEffect(
    useCallback(() => {
      if (!tabTransition) return undefined;
      tabProgress.setValue(0);
      const animation = Animated.timing(tabProgress, {
        toValue: 1,
        duration: 160,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      });
      animation.start();
      return () => animation.stop();
    }, [tabProgress, tabTransition]),
  );
  const tabTransitionStyle = tabTransition
    ? {
        transform: [{ translateX: tabProgress.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
      }
    : undefined;
  if (!scroll) {
    return (
      <AnimatedSafeAreaView edges={['top']} style={[styles.container, tabTransitionStyle, style]}>
        {backdrop && <CyanBackdrop />}
        {children}
      </AnimatedSafeAreaView>
    );
  }
  return (
    <AnimatedSafeAreaView edges={['top']} style={[styles.container, tabTransitionStyle, style]}>
      {backdrop && <CyanBackdrop />}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: spacing.xl + insets.bottom },
          contentContainerStyle,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </AnimatedSafeAreaView>
  );
}

function createStyles(color: ReturnType<typeof useTheme>['color']) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.canvas,
  },
  scroll: {
    flex: 1,
    backgroundColor: color.canvas,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  });
}
