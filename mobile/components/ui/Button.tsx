import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { fontFamily, fontSize, radius, spacing, useTheme } from '../../lib/theme';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = true,
}: ButtonProps) {
  const { color } = useTheme();
  const styles = createStyles(color);
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        fullWidth && { alignSelf: 'stretch' },
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
    >
      {variant === 'primary' && !isDisabled ? (
        <Svg pointerEvents="none" width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="clientflow-button-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={color.accent} />
              <Stop offset="100%" stopColor={color.accentPressed} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" rx={14} fill="url(#clientflow-button-gradient)" />
        </Svg>
      ) : null}
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? color.textOnAccent : color.accent}
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.label,
            variant === 'primary' && styles.labelOnAccent,
            variant === 'secondary' && styles.labelPrimary,
            variant === 'ghost' && styles.labelAccent,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

function createStyles(color: ReturnType<typeof useTheme>['color']) {
  return StyleSheet.create({
  base: {
    height: 50,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    overflow: 'hidden',
  },
  primary: {
    backgroundColor: color.accentPressed,
    shadowColor: color.accent,
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  secondary: {
    backgroundColor: color.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.76,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.body,
  },
  labelOnAccent: {
    color: color.textOnAccent,
  },
  labelPrimary: {
    color: color.textPrimary,
  },
  labelAccent: {
    color: color.accentText,
  },
  });
}
