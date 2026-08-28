import { forwardRef, type PropsWithChildren } from 'react';
import {
  ScrollView,
  StyleProp,
  StyleSheet,
  ViewStyle,
  type ScrollViewProps,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, useTheme } from '../../lib/theme';
import { AtmosphereBackground } from './AtmosphereBackground';

interface ScreenProps extends PropsWithChildren {
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: ViewStyle;
  onScroll?: ScrollViewProps['onScroll'];
  scrollEventThrottle?: number;
}

export const Screen = forwardRef<ScrollView, ScreenProps>(function Screen(
  { children, scroll = true, style, contentContainerStyle, onScroll, scrollEventThrottle },
  ref,
) {
  const { color } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(color);
  if (!scroll) {
    return (
      <SafeAreaView edges={['top']} style={[styles.container, style]}>
        <AtmosphereBackground />
        {children}
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView edges={['top']} style={[styles.container, style]}>
      <AtmosphereBackground />
      <ScrollView
        ref={ref}
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: spacing.xl + insets.bottom },
          contentContainerStyle,
        ]}
        keyboardShouldPersistTaps="handled"
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
});

function createStyles(color: ReturnType<typeof useTheme>['color']) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.background,
  },
  scroll: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  });
}
