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
    <View style={[styles.message, preview && styles.previewMessage, isClient && styles.clientMessage]}>
      <View style={styles.markerColumn}>
        <View style={[styles.marker, isClient ? styles.clientMarker : styles.studioMarker]} />
      </View>
      <View style={styles.messageContent}>
        <View style={styles.metaRow}>
          <Text style={styles.author}>{note.authorName}</Text>
          <Text style={styles.roleTag}>{isClient ? t('notes.you') : t('notes.studio')}</Text>
          <Text style={styles.time}>{formatRelativeTime(note.createdAt)}</Text>
        </View>
        <View style={[styles.bodyWrap, isClient && styles.clientBodyWrap]}>
          <Text style={styles.body}>{note.body}</Text>
        </View>
      </View>
    </View>
  );
}

function createStyles(color: ReturnType<typeof useTheme>['color']) {
  return StyleSheet.create({
  message: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.border,
  },
  clientMessage: {
    backgroundColor: 'rgba(202, 244, 255, 0.16)',
    marginHorizontal: -spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  previewMessage: {
    paddingVertical: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  markerColumn: {
    width: 14,
    alignItems: 'center',
    paddingTop: 4,
  },
  marker: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  clientMarker: {
    backgroundColor: color.accentPressed,
  },
  studioMarker: {
    backgroundColor: color.borderStrong,
  },
  messageContent: {
    flex: 1,
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
    fontFamily: fontFamily.regular,
    fontSize: fontSize.meta,
    color: color.textMuted,
    marginLeft: 'auto',
  },
  bodyWrap: {
    paddingRight: spacing.md,
  },
  clientBodyWrap: {
    paddingRight: 0,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.body,
    color: color.textSecondary,
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
