import { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { spacing, useTheme } from '../../lib/theme';

interface ScreenProps extends PropsWithChildren {
  scroll?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

export function Screen({
  children,
  scroll = true,
  style,
  contentContainerStyle,
}: ScreenProps) {
  const { color } = useTheme();
  const styles = createStyles(color);
  if (!scroll) {
    return <View style={[styles.container, style]}>{children}</View>;
  }
  return (
    <ScrollView
      style={[styles.container, style]}
      contentContainerStyle={[styles.content, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

function createStyles(color: ReturnType<typeof useTheme>['color']) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  });
}
