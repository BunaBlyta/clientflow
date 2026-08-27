import { Bell, ChevronRight, X } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontFamily, spacing, useTheme } from '../lib/theme';
import type { Notification } from '../lib/types';
import { useI18n } from '../lib/i18n';
import {
  getLocalizedNotificationText,
  getUserAuthoredInvoiceDescription,
  getUserAuthoredNotificationBody,
} from '../lib/notification-text';
import { useTranslatedUserContent } from '../lib/content-translation';
import { useAuthStore } from '../store/auth-store';

interface InAppNotificationBannerProps {
  notification: Notification;
  onPress: () => void;
  onDismiss: () => void;
}

export function InAppNotificationBanner({
  notification,
  onPress,
  onDismiss,
}: InAppNotificationBannerProps) {
  const { color } = useTheme();
  const { language, t } = useI18n();
  const token = useAuthStore((state) => state.token);
  const localized = getLocalizedNotificationText(notification, t);
  const authoredBody = getUserAuthoredNotificationBody(notification);
  const invoiceDescription = getUserAuthoredInvoiceDescription(notification);
  const contentToTranslate = authoredBody ?? invoiceDescription;
  const translatedContent = useTranslatedUserContent(
    contentToTranslate ?? '',
    language,
    token,
    contentToTranslate !== null,
  );
  const displayedBody = authoredBody !== null
    ? translatedContent
    : invoiceDescription !== null
      ? getLocalizedNotificationText(notification, t, { invoiceDescription: translatedContent }).body
      : localized.body;
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-140)).current;
  const styles = createStyles(color);

  useEffect(() => {
    translateY.setValue(-140);
    const enter = Animated.timing(translateY, {
      toValue: 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    enter.start();

    const timeout = setTimeout(() => {
      Animated.timing(translateY, {
        toValue: -140,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onDismiss();
      });
    }, 5_000);

    return () => clearTimeout(timeout);
  }, [notification.id, onDismiss, translateY]);

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.position, { top: insets.top + spacing.sm }, { transform: [{ translateY }] }]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${localized.title}. ${displayedBody}`}
        onPress={onPress}
        style={({ pressed }) => [styles.banner, pressed && styles.pressed]}
      >
        <View style={styles.iconWrap}>
          <Bell size={17} color={color.accentText} strokeWidth={2} />
        </View>
        <View style={styles.copy}>
          <Text numberOfLines={1} style={styles.title}>{localized.title}</Text>
          <Text numberOfLines={2} style={styles.body}>{displayedBody}</Text>
        </View>
        <ChevronRight size={17} color={color.textMuted} strokeWidth={1.8} />
        <Pressable
          accessibilityLabel={t('ui.dismissNotification')}
          hitSlop={8}
          onPress={(event) => {
            event.stopPropagation();
            onDismiss();
          }}
          style={styles.dismiss}
        >
          <X size={15} color={color.textMuted} strokeWidth={1.8} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

function createStyles(color: ReturnType<typeof useTheme>['color']) {
  return StyleSheet.create({
    position: {
      left: spacing.lg,
      right: spacing.lg,
      position: 'absolute',
      zIndex: 20,
    },
    banner: {
      alignItems: 'center',
      backgroundColor: color.surface,
      borderColor: color.border,
      borderRadius: 10,
      borderWidth: 1,
      flexDirection: 'row',
      gap: spacing.sm,
      minHeight: 64,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    pressed: {
      opacity: 0.86,
    },
    iconWrap: {
      alignItems: 'center',
      backgroundColor: color.accentSoft,
      borderRadius: 7,
      height: 32,
      justifyContent: 'center',
      width: 32,
    },
    copy: {
      flex: 1,
      gap: 2,
    },
    title: {
      color: color.textPrimary,
      fontFamily: fontFamily.semibold,
      fontSize: 13,
    },
    body: {
      color: color.textMuted,
      fontFamily: fontFamily.regular,
      fontSize: 12,
      lineHeight: 17,
    },
    dismiss: {
      alignItems: 'center',
      height: 24,
      justifyContent: 'center',
      width: 24,
    },
  });
}
