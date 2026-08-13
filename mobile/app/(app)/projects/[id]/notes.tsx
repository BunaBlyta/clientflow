import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, MessageSquare, Send } from 'lucide-react-native';
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
import { NoteBubble } from '../../../../components/NoteBubble';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { Screen } from '../../../../components/ui/Screen';
import { fontFamily, fontSize, radius, spacing, useTheme } from '../../../../lib/theme';
import { useI18n } from '../../../../lib/i18n';
import { useAuthStore } from '../../../../store/auth-store';
import { useDataStore } from '../../../../store/data-store';
import { useShallow } from 'zustand/react/shallow';

export default function ProjectNotesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { color } = useTheme();
  const { t } = useI18n();
  const styles = createStyles(color);
  const token = useAuthStore((s) => s.token);
  const notes = useDataStore(useShallow((s) => s.notesForProject(id)));
  const postNote = useDataStore((s) => s.postNote);
  const refreshNotes = useDataStore((s) => s.refreshNotes);

  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [unreachable, setUnreachable] = useState(false);
  const [postError, setPostError] = useState('');
  const scrollRef = useRef<ScrollView>(null);

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
        <Pressable onPress={() => router.replace(`/projects/${id}`)} style={styles.backControl}>
          <ArrowLeft size={16} color={color.accent} />
          <Text style={styles.backControlText}>{t('common.backToProject')}</Text>
        </Pressable>
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
        contentContainerStyle={styles.content}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        <Pressable onPress={() => router.replace(`/projects/${id}`)} style={styles.backControl}>
          <ArrowLeft size={16} color={color.accent} />
          <Text style={styles.backControlText}>{t('common.backToProject')}</Text>
        </Pressable>
        {unreachable && (
          <Text style={styles.error}>
            {t('notes.unavailable')}
          </Text>
        )}
        <Text style={styles.intro}>
          {t('notes.intro')}
        </Text>
        {notes.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title={t('notes.noNotes')}
            subtitle={t('notes.emptySubtitle')}
          />
        ) : (
          notes.map((note) => <NoteBubble key={note.id} note={note} />)
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
            style={styles.input}
            multiline
            editable={!posting}
          />
          <Pressable
            onPress={() => void handleSend()}
            disabled={!draft.trim() || posting}
            style={[styles.sendButton, (!draft.trim() || posting) && styles.sendButtonDisabled]}
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
  flex: { flex: 1, backgroundColor: color.background },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  loading: {
    marginTop: spacing.xxl,
  },
  backControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  backControlText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.caption,
    color: color.accent,
  },
  error: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.meta,
    color: color.warning,
    marginBottom: spacing.md,
  },
  intro: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.meta,
    color: color.textMuted,
    marginBottom: spacing.lg,
    lineHeight: 17,
  },
  composer: {
    padding: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.border,
    backgroundColor: color.surface,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.body,
    color: color.textPrimary,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: color.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  });
}
