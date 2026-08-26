import { StyleSheet, Text, View } from 'react-native';
import { formatRelativeTime } from '../lib/format';
import { fontFamily, fontSize, radius, spacing, useTheme } from '../lib/theme';
import { useI18n } from '../lib/i18n';
import type { Note } from '../lib/types';

interface NoteBubbleProps {
  note: Note;
  preview?: boolean;
  showAuthor?: boolean;
}

export function NoteBubble({ note, preview = false, showAuthor = true }: NoteBubbleProps) {
  const { color } = useTheme();
  const { language, t } = useI18n();
  const styles = createStyles(color);
  if (note.authorRole === 'SYSTEM') {
    const isStatusChange = note.body.toLowerCase().startsWith('project status changed');

    return (
      <View style={[styles.systemRow, preview && styles.previewSystemRow]}>
        <View style={styles.systemLine} />
        <Text style={[styles.systemText, isStatusChange && styles.statusChangeText]}>
          {isStatusChange ? note.body : `${note.body} · ${formatRelativeTime(note.createdAt, language)}`}
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
        <View style={[styles.bodyWrap, preview && !isClient && styles.previewBodyWrap, isClient && styles.clientBodyWrap]}>
          <Text style={[styles.body, isClient && styles.clientBody]}>{note.body}</Text>
          <Text style={[styles.time, isClient && styles.clientTime]}>
            {formatNoteTime(note.createdAt, language)}
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
  bodyWrap: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: color.surfaceSage,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
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
