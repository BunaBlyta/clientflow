import { StyleSheet, Text, View } from 'react-native';
import { formatDateTime } from '../lib/format';
import { fontFamily, fontSize, spacing, useTheme } from '../lib/theme';
import { useI18n } from '../lib/i18n';
import type { Note } from '../lib/types';

interface NoteBubbleProps {
  note: Note;
}

export function NoteBubble({ note }: NoteBubbleProps) {
  const { color } = useTheme();
  const { t } = useI18n();
  const styles = createStyles(color);
  if (note.authorRole === 'SYSTEM') {
    return (
      <View style={styles.systemRow}>
        <View style={styles.systemDot} />
        <Text style={styles.systemText}>{note.body}</Text>
        <Text style={styles.systemTime}>{formatDateTime(note.createdAt)}</Text>
      </View>
    );
  }

  const isClient = note.authorRole === 'CLIENT';

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.author}>{note.authorName}</Text>
        <Text style={styles.roleTag}>{isClient ? t('notes.you') : t('notes.studio')}</Text>
        <Text style={styles.time}>{formatDateTime(note.createdAt)}</Text>
      </View>
      <View style={styles.bodyWrap}>
        <Text style={styles.body}>{note.body}</Text>
      </View>
    </View>
  );
}

function createStyles(color: ReturnType<typeof useTheme>['color']) {
  return StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginBottom: spacing.xs,
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
    paddingTop: spacing.xs,
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
    gap: spacing.sm,
    marginBottom: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.border,
  },
  systemDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: color.textMuted,
  },
  systemText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.meta,
    color: color.textMuted,
    fontStyle: 'italic',
  },
  systemTime: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.meta,
    color: color.textMuted,
  },
  });
}
