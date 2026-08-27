import {
  Clipboard,
  Dimensions,
  type GestureResponderEvent,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Check, Copy, RotateCcw } from 'lucide-react-native';
import { useState } from 'react';
import { formatRelativeTime } from '../lib/format';
import { fontFamily, fontSize, radius, spacing, useTheme } from '../lib/theme';
import { useI18n } from '../lib/i18n';
import { useTranslatedUserContent } from '../lib/content-translation';
import { useAuthStore } from '../store/auth-store';
import type { Note } from '../lib/types';

export type NoteDeliveryStatus = 'sending' | 'sent' | 'failed';

interface NoteBubbleProps {
  note: Note;
  preview?: boolean;
  showAuthor?: boolean;
  // Set for the sender's own optimistic messages: swaps the timestamp for a
  // delivery indicator. 'failed' makes the bubble tappable to retry.
  status?: NoteDeliveryStatus;
  onRetry?: () => void;
}

export function NoteBubble({ note, preview = false, showAuthor = true, status, onRetry }: NoteBubbleProps) {
  const { color } = useTheme();
  const { language, t } = useI18n();
  const token = useAuthStore((state) => state.token);
  const styles = createStyles(color);
  const displayedBody = useTranslatedUserContent(
    note.body,
    language,
    token,
    note.authorRole !== 'SYSTEM',
  );
  const [menuAnchor, setMenuAnchor] = useState<{ x: number; y: number } | null>(null);

  function handleLongPress(event: GestureResponderEvent) {
    const { pageX, pageY } = event.nativeEvent;
    setMenuAnchor({ x: pageX, y: pageY });
  }

  function handleCopy() {
    Clipboard.setString(displayedBody);
    setMenuAnchor(null);
  }

  if (note.authorRole === 'SYSTEM') {
    const isStatusChange = note.body.toLowerCase().startsWith('project status changed');

    return (
      <View style={[styles.systemRow, preview && styles.previewSystemRow]}>
        {!isStatusChange && <View style={styles.systemLine} />}
        <Text style={[styles.systemText, isStatusChange && styles.statusChangeText]}>
          {isStatusChange ? note.body : `${note.body} · ${formatRelativeTime(note.createdAt, language)}`}
        </Text>
        {!isStatusChange && <View style={styles.systemLine} />}
      </View>
    );
  }

  const isClient = note.authorRole === 'CLIENT';
  const initials = note.authorName
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View style={[styles.message, preview && styles.previewMessage, isClient && styles.clientMessage]}>
      {!isClient && (
        <View style={[styles.avatar, styles.studioAvatar]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      )}
      <View style={[styles.messageContent, isClient && styles.clientMessageContent]}>
        {showAuthor && (
          <View style={[styles.metaRow, isClient && styles.clientMetaRow]}>
            <Text style={styles.author}>{note.authorName}</Text>
            {!isClient && <Text style={styles.roleTag}>{t('notes.studio')}</Text>}
          </View>
        )}
        <Pressable
          onLongPress={preview ? undefined : handleLongPress}
          onPress={status === 'failed' ? onRetry : undefined}
          disabled={preview}
          style={({ pressed }) => [
            styles.bodyWrap,
            preview && !isClient && styles.previewBodyWrap,
            isClient && styles.clientBodyWrap,
            status === 'failed' && styles.failedBodyWrap,
            pressed && !preview && styles.bodyWrapPressed,
          ]}
        >
          <Text style={[styles.body, isClient && styles.clientBody]}>{displayedBody}</Text>
          {status ? (
            <View style={styles.statusRow}>
              {status === 'sent' && <Check size={11} color={color.textOnAccent} strokeWidth={2.4} />}
              {status === 'failed' && <RotateCcw size={11} color={color.textOnAccent} strokeWidth={2.2} />}
              <Text style={[styles.time, styles.clientTime, styles.statusText, status === 'failed' && styles.statusFailed]}>
                {status === 'sending'
                  ? t('notes.sending')
                  : status === 'sent'
                    ? t('notes.sent')
                    : t('notes.sendRetry')}
              </Text>
            </View>
          ) : (
            <Text style={[styles.time, isClient && styles.clientTime]}>
              {formatNoteTime(note.createdAt, language)}
            </Text>
          )}
        </Pressable>
      </View>
      {menuAnchor && (
        <Modal transparent visible animationType="fade" onRequestClose={() => setMenuAnchor(null)}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuAnchor(null)} />
          <View
            style={[
              styles.copyMenu,
              {
                left: Math.min(
                  Math.max(menuAnchor.x - COPY_MENU_WIDTH / 2, spacing.md),
                  Dimensions.get('window').width - COPY_MENU_WIDTH - spacing.md,
                ),
                top: Math.max(menuAnchor.y - 64, spacing.xxl),
              },
            ]}
          >
            <Pressable
              onPress={handleCopy}
              accessibilityRole="button"
              accessibilityLabel={t('notes.copyMessage')}
              style={({ pressed }) => [styles.copyMenuItem, pressed && styles.copyMenuItemPressed]}
            >
              <Copy size={15} color={color.textPrimary} strokeWidth={1.8} />
              <Text style={styles.copyMenuLabel}>{t('notes.copyMessage')}</Text>
            </Pressable>
          </View>
        </Modal>
      )}
    </View>
  );
}

const COPY_MENU_WIDTH = 148;

function createStyles(color: ReturnType<typeof useTheme>['color']) {
  return StyleSheet.create({
  message: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  clientMessage: {
    justifyContent: 'flex-end',
  },
  previewMessage: {
    paddingVertical: spacing.sm,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studioAvatar: {
    backgroundColor: color.surfaceMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border,
  },
  avatarText: {
    fontFamily: fontFamily.medium,
    fontSize: 10,
    color: color.textSecondary,
    letterSpacing: 0.3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  clientMetaRow: {
    justifyContent: 'flex-end',
  },
  messageContent: {
    flexShrink: 1,
    maxWidth: '84%',
    minWidth: 0,
    alignItems: 'flex-start',
  },
  clientMessageContent: {
    alignItems: 'flex-end',
  },
  author: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.caption,
    color: color.textPrimary,
  },
  roleTag: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.meta,
    color: color.textMuted,
  },
  time: {
    alignSelf: 'flex-end',
    fontFamily: fontFamily.regular,
    fontSize: fontSize.meta,
    color: color.textMuted,
    marginTop: spacing.xs,
  },
  clientTime: {
    color: color.textOnAccent,
    opacity: 0.75,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 3,
    marginTop: spacing.xs,
  },
  statusText: {
    marginTop: 0,
  },
  statusFailed: {
    opacity: 1,
    fontFamily: fontFamily.medium,
  },
  bodyWrap: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: color.surfaceSage,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
  },
  bodyWrapPressed: {
    opacity: 0.85,
  },
  copyMenu: {
    position: 'absolute',
    width: COPY_MENU_WIDTH,
    borderRadius: radius.md,
    backgroundColor: color.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border,
    overflow: 'hidden',
  },
  copyMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  copyMenuItemPressed: {
    backgroundColor: color.surfaceMuted,
  },
  copyMenuLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.caption,
    color: color.textPrimary,
  },
  previewBodyWrap: {
    backgroundColor: color.surfaceSage,
  },
  clientBodyWrap: {
    alignSelf: 'flex-end',
    backgroundColor: color.accent,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 4,
  },
  failedBodyWrap: {
    backgroundColor: color.danger,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.body,
    color: color.textSecondary,
    lineHeight: 20,
  },
  clientBody: {
    color: color.textOnAccent,
  },
  systemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  systemLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: color.border,
  },
  previewSystemRow: {
    marginVertical: spacing.xs,
  },
  systemText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.meta,
    color: color.textMuted,
    fontStyle: 'italic',
    flexShrink: 1,
    textAlign: 'center',
  },
  statusChangeText: {
    color: color.textMuted,
    fontFamily: fontFamily.regular,
  },
  systemTime: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.meta,
    color: color.textMuted,
  },
  });
}

function formatNoteTime(iso: string, language: 'en' | 'sq' | 'de') {
  const locale = language === 'sq' ? 'sq-AL' : language === 'de' ? 'de-DE' : 'en-US';
  return new Date(iso).toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
  });
}
