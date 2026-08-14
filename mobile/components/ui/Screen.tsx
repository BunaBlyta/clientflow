import { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, useTheme } from '../../lib/theme';
import { CyanBackdrop } from './CyanBackdrop';

interface ScreenProps extends PropsWithChildren {
  scroll?: boolean;
  backdrop?: boolean;
  style?: ViewStyle;
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
      <View style={[styles.container, style]}>
        {backdrop && <CyanBackdrop />}
        {children}
      </View>
    );
  }
  return (
    <View style={[styles.container, style]}>
      {backdrop && <CyanBackdrop />}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.md },
          { paddingBottom: spacing.xl + insets.bottom },
          contentContainerStyle,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

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
