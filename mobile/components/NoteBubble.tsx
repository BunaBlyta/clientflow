import { StyleSheet, Text, View } from 'react-native';
import { formatRelativeTime } from '../lib/format';
import { fontFamily, fontSize, radius, spacing, useTheme } from '../lib/theme';
import { useI18n } from '../lib/i18n';
import type { Note } from '../lib/types';

interface NoteBubbleProps {
  note: Note;
  preview?: boolean;
}

export function NoteBubble({ note, preview = false }: NoteBubbleProps) {
  const { color } = useTheme();
  const { t } = useI18n();
  const styles = createStyles(color);
  if (note.authorRole === 'SYSTEM') {
    return (
      <View style={[styles.systemRow, preview && styles.previewSystemRow]}>
        <View style={styles.systemLine} />
        <Text style={styles.systemText}>
          {note.body} · {formatRelativeTime(note.createdAt)}
        </Text>
        <View style={styles.systemLine} />
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
      <View style={[styles.avatar, isClient ? styles.clientAvatar : styles.studioAvatar]}>
        <Text style={[styles.avatarText, isClient && styles.clientAvatarText]}>{initials}</Text>
      </View>
      <View style={[styles.messageContent, isClient && styles.clientMessageContent]}>
        <View style={[styles.metaRow, isClient && styles.clientMetaRow]}>
          <Text style={styles.author}>{note.authorName}</Text>
          <Text style={styles.roleTag}>{isClient ? t('notes.you') : t('notes.studio')}</Text>
        </View>
        <View style={[styles.bodyWrap, isClient && styles.clientBodyWrap]}>
          <Text style={[styles.body, isClient && styles.clientBody]}>{note.body}</Text>
          <Text style={[styles.time, isClient && styles.clientTime]}>
            {formatNoteTime(note.createdAt)}
          </Text>
        </View>
      </View>
    </View>
  );
}

function createStyles(color: ReturnType<typeof useTheme>['color']) {
  return StyleSheet.create({
  message: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  clientMessage: {
    flexDirection: 'row-reverse',
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
  clientAvatar: {
    backgroundColor: color.accent,
  },
  avatarText: {
    fontFamily: fontFamily.medium,
    fontSize: 10,
    color: color.textSecondary,
    letterSpacing: 0.3,
  },
  clientAvatarText: {
    color: color.textOnAccent,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  clientMetaRow: {
    justifyContent: 'flex-end',
  },
  messageContent: {
    flex: 1,
    maxWidth: '84%',
    minWidth: 0,
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
    color: color.textMuted,
  },
  bodyWrap: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: color.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border,
    borderRadius: radius.lg,
  },
  clientBodyWrap: {
    backgroundColor: color.accentSoft,
    borderColor: color.accentSoft,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.body,
    color: color.textSecondary,
    lineHeight: 20,
  },
  clientBody: {
    color: color.textPrimary,
  },
  systemRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  systemTime: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.meta,
    color: color.textMuted,
  },
  });
}

function formatNoteTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}
