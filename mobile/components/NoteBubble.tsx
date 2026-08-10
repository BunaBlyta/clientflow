import { StyleSheet, Text, View } from 'react-native';
import { formatDateTime } from '../lib/format';
import { color, fontFamily, fontSize, radius, spacing } from '../lib/theme';
import type { Note } from '../lib/types';

interface NoteBubbleProps {
  note: Note;
}

export function NoteBubble({ note }: NoteBubbleProps) {
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
        <Text style={styles.roleTag}>{isClient ? 'You' : 'Studio'}</Text>
        <Text style={styles.time}>{formatDateTime(note.createdAt)}</Text>
      </View>
      <View
        style={[
          styles.bubble,
          isClient ? styles.bubbleClient : styles.bubbleStaff,
        ]}
      >
        <Text style={styles.body}>{note.body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
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
  bubble: {
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
  },
  bubbleClient: {
    backgroundColor: color.accentSoft,
    borderColor: '#C7E5FF',
  },
  bubbleStaff: {
    backgroundColor: color.surfaceMuted,
    borderColor: color.border,
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
