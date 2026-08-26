import { useLocalSearchParams } from 'expo-router';
import { MessageSquare, Send } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NoteBubble } from '../../../../components/NoteBubble';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { formatDate } from '../../../../lib/format';
import { AtmosphereBackground } from '../../../../components/ui/AtmosphereBackground';
import { fontFamily, fontSize, radius, spacing, useTheme } from '../../../../lib/theme';
import { useI18n } from '../../../../lib/i18n';
import { useAuthStore } from '../../../../store/auth-store';
import { useDataStore } from '../../../../store/data-store';
import { useShallow } from 'zustand/react/shallow';
import { AppBackButton } from '../../../../components/OriginBackButton';

export default function ProjectNotesScreen() {
  const { id, source } = useLocalSearchParams<{ id: string; source?: string }>();
  const { color } = useTheme();
  const { language, t } = useI18n();
  const styles = createStyles(color);
  const insets = useSafeAreaInsets();
  const token = useAuthStore((s) => s.token);
  const project = useDataStore((s) => s.projectById(id));
  const notes = useDataStore(useShallow((s) => s.notesForProject(id)));
  const postNote = useDataStore((s) => s.postNote);
  const refreshNotes = useDataStore((s) => s.refreshNotes);

  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [unreachable, setUnreachable] = useState(false);
  const [postError, setPostError] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  // The store returns notes oldest-to-newest so the newest message stays
  // closest to the composer, like a normal chat timeline.
  const orderedNotes = notes;

  useEffect(() => {
    if (!token || !id) {
      setLoading(false);
      return;
    }
    let active = true;
    void refreshNotes(token, id).then((ok) => {
      if (active) {
        setUnreachable(!ok);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [id, refreshNotes, token]);

  const notesHeader = (
    <View style={[styles.stickyHeader, { paddingTop: insets.top + spacing.sm }]}>
      <AppBackButton source={source} accessibilityLabel={t('common.backToProject')} />
      <View style={styles.headerCopy}>
        <Text style={styles.screenTitle}>{t('projects.notes')}</Text>
        {project?.name ? (
          <Text style={styles.projectName} numberOfLines={1}>
            {project.name}
          </Text>
        ) : null}
      </View>
    </View>
  );

  async function handleSend() {
    const body = draft.trim();
    if (!body || !id || !token || posting) return;

    setPostError('');
    setPosting(true);
    const ok = await postNote(id, body, token);
    setPosting(false);
    if (!ok) {
      setPostError(t('notes.postFailed'));
      return;
    }

    setDraft('');
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }

  if (loading && notes.length === 0) {
    return (
      <View style={styles.flex}>
        <AtmosphereBackground />
        {notesHeader}
        <ActivityIndicator color={color.accent} style={styles.loading} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <AtmosphereBackground />
      {notesHeader}
      <ScrollView
        ref={scrollRef}
        style={styles.flex}
        contentContainerStyle={[
          styles.content,
          { flexGrow: 1 },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          if (notes.length > 0) scrollRef.current?.scrollToEnd({ animated: false });
        }}
      >
        {unreachable && (
          <Text style={styles.error}>
            {t('notes.unavailable')}
          </Text>
        )}
        {notes.length === 0 ? (
          <View style={styles.emptyState}>
            <EmptyState
              icon={MessageSquare}
              title={t('notes.noNotes')}
              subtitle={t('notes.emptySubtitle')}
            />
          </View>
        ) : (
          <View style={styles.timeline}>
            {orderedNotes.map((note, index) => {
              const previousNote = orderedNotes[index - 1];
              const noteDate = formatDate(note.createdAt, language);
              const showDate = !previousNote || formatDate(previousNote.createdAt, language) !== noteDate;

              return (
                <View key={note.id}>
                  {showDate && (
                    <View style={styles.dateSeparator}>
                      <View style={styles.dateLine} />
                      <Text style={styles.dateLabel}>{noteDate}</Text>
                      <View style={styles.dateLine} />
                    </View>
                  )}
                  <NoteBubble
                    note={note}
                    showAuthor={
                      !previousNote ||
                      previousNote.authorRole === 'SYSTEM' ||
                      previousNote.authorRole !== note.authorRole ||
                      previousNote.authorName !== note.authorName
                    }
                  />
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={styles.composer}>
        {postError ? <Text style={styles.error}>{postError}</Text> : null}
        <View style={styles.composerRow}>
          <TextInput
            value={draft}
            onChangeText={(value) => {
              setDraft(value);
              if (postError) setPostError('');
            }}
            placeholder={t('notes.writeNote')}
            placeholderTextColor={color.textMuted}
            style={[styles.input, inputFocused && styles.inputFocused]}
            multiline
            editable={!posting}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
          />
          <Pressable
            onPress={() => void handleSend()}
            disabled={!draft.trim() || posting}
            accessibilityRole="button"
            accessibilityLabel={t('common.send')}
            style={({ pressed }) => [
              styles.sendButton,
              (!draft.trim() || posting) && styles.sendButtonDisabled,
              pressed && draft.trim().length > 0 && !posting && styles.sendButtonPressed,
            ]}
          >
            {posting ? (
              <ActivityIndicator size="small" color={color.textOnAccent} />
            ) : (
              <Send size={16} color={color.textOnAccent} />
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function createStyles(color: ReturnType<typeof useTheme>['color']) {
  return StyleSheet.create({
  flex: { flex: 1, backgroundColor: 'transparent' },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  loading: {
    marginTop: spacing.xxl,
  },
  error: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.meta,
    color: color.warning,
    marginBottom: spacing.md,
  },
  stickyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: color.canvas,
    borderBottomWidth: 1,
    borderBottomColor: color.borderStrong,
    zIndex: 1,
    elevation: 1,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  screenTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.heading,
    color: color.textPrimary,
  },
  projectName: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.caption,
    color: color.textMuted,
    marginTop: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
  },
  intro: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.meta,
    lineHeight: 17,
    color: color.textMuted,
  },
  timeline: {
    paddingBottom: spacing.sm,
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  dateLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: color.border,
  },
  dateLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.meta,
    color: color.textMuted,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 260,
  },
  composer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: color.border,
    backgroundColor: color.surface,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 46,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.body,
    color: color.textPrimary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    textAlignVertical: 'top',
    backgroundColor: color.surfaceMuted,
    maxHeight: 112,
  },
  inputFocused: {
    borderColor: color.accent,
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: color.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonPressed: {
    opacity: 0.78,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  });
}
