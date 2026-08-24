import type { PropsWithChildren } from 'react';
import { ScrollView, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, useTheme } from '../../lib/theme';
import { CyanBackdrop } from './CyanBackdrop';

interface ScreenProps extends PropsWithChildren {
  scroll?: boolean;
  backdrop?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: ViewStyle;
}

export function Screen({
  children,
  scroll = true,
  backdrop = false,
  style,
  contentContainerStyle,
}: ScreenProps) {
  const { color } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(color);
  if (!scroll) {
    return (
      <SafeAreaView edges={['top']} style={[styles.container, style]}>
        {backdrop && <CyanBackdrop />}
        {children}
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView edges={['top']} style={[styles.container, style]}>
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
    </SafeAreaView>
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
