import { StyleSheet, Text, View } from 'react-native';
import { formatRelativeTime } from '../lib/format';
import { fontFamily, fontSize, spacing, useTheme } from '../lib/theme';
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
        <Text style={styles.systemText}>
          {note.body}
          <Text style={styles.systemTime}> · {formatRelativeTime(note.createdAt)}</Text>
        </Text>
      </View>
    );
  }

  const isClient = note.authorRole === 'CLIENT';

  return (
    <View
      style={[
        styles.message,
        preview && styles.previewMessage,
        isClient ? styles.clientMessage : styles.studioMessage,
      ]}
    >
      <View style={[styles.metaRow, isClient && styles.clientMetaRow]}>
        <View style={styles.authorGroup}>
          <Text style={styles.author}>{note.authorName}</Text>
          <Text style={styles.roleTag}>{isClient ? t('notes.you') : t('notes.studio')}</Text>
        </View>
      </View>
      <View style={[styles.bubble, isClient ? styles.clientBubble : styles.studioBubble]}>
        <Text style={[styles.body, isClient ? styles.clientBody : styles.studioBody]}>{note.body}</Text>
        <Text
          style={[
            styles.bubbleTime,
            isClient ? styles.clientBubbleTime : styles.studioBubbleTime,
          ]}
        >
          {formatRelativeTime(note.createdAt)}
        </Text>
      </View>
    </View>
  );
}

function createStyles(color: ReturnType<typeof useTheme>['color']) {
  return StyleSheet.create({
  message: {
    maxWidth: '86%',
    marginBottom: spacing.lg,
  },
  clientMessage: {
    alignSelf: 'flex-end',
  },
  previewMessage: {
    marginBottom: spacing.sm,
  },
  studioMessage: {
    alignSelf: 'flex-start',
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
  authorGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    flexShrink: 1,
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
  bubbleTime: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.meta,
    color: color.textMuted,
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
  },
  clientBubbleTime: {
    color: '#07131D',
  },
  clientBody: {
    color: '#07131D',
  },
  studioBody: {
    color: '#07131D',
  },
  studioBubbleTime: {
    color: '#07131D',
  },
  bubble: {
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  clientBubble: {
    backgroundColor: color.accentSoft,
    borderBottomRightRadius: spacing.xs,
  },
  studioBubble: {
    backgroundColor: '#CBD5DC',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.surfaceMuted,
    borderBottomLeftRadius: spacing.xs,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.body,
    color: color.textPrimary,
    lineHeight: 20,
  },
  systemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.border,
    borderTopColor: color.border,
  },
  previewSystemRow: {
    marginVertical: spacing.xs,
  },
  systemText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.meta,
    color: color.textMuted,
    fontStyle: 'italic',
  },
  systemTime: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.meta,
    color: '#64747D',
  },
  });
}
