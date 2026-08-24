import { useLocalSearchParams } from 'expo-router';
import { Info, MessageSquare, Send } from 'lucide-react-native';
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
import { Screen } from '../../../../components/ui/Screen';
import { fontFamily, fontSize, radius, spacing, useTheme } from '../../../../lib/theme';
import { useI18n } from '../../../../lib/i18n';
import { useAuthStore } from '../../../../store/auth-store';
import { useDataStore } from '../../../../store/data-store';
import { useShallow } from 'zustand/react/shallow';

export default function ProjectNotesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { color } = useTheme();
  const { t } = useI18n();
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
  const orderedNotes = [...notes].reverse();

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
      <Screen>
        <ActivityIndicator color={color.accent} style={styles.loading} />
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.flex}
        contentContainerStyle={[
          styles.content,
          { flexGrow: 1 },
          { paddingTop: insets.top + spacing.lg },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          if (notes.length > 0) scrollRef.current?.scrollToEnd({ animated: false });
        }}
      >
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <MessageSquare size={20} color={color.accentText} strokeWidth={1.8} />
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.screenTitle}>{t('projects.notes')}</Text>
            {project?.name ? (
              <Text style={styles.projectName} numberOfLines={1}>
                {project.name}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={styles.infoRow}>
          <Info size={15} color={color.textMuted} strokeWidth={1.8} />
          <Text style={styles.intro}>{t('notes.intro')}</Text>
        </View>
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
              const noteDate = formatDate(note.createdAt);
              const showDate = !previousNote || formatDate(previousNote.createdAt) !== noteDate;

              return (
                <View key={note.id}>
                  {showDate && (
                    <View style={styles.dateSeparator}>
                      <View style={styles.dateLine} />
                      <Text style={styles.dateLabel}>{noteDate}</Text>
                      <View style={styles.dateLine} />
                    </View>
                  )}
                  <NoteBubble note={note} />
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
  flex: { flex: 1, backgroundColor: color.canvas },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: color.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: color.surfaceMuted,
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
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.border,
    backgroundColor: color.canvas,
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
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    textAlignVertical: 'top',
    backgroundColor: color.surface,
    maxHeight: 112,
  },
  inputFocused: {
    borderColor: color.accent,
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: radius.lg,
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
