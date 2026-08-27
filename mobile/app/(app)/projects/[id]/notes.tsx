import { useLocalSearchParams } from 'expo-router';
import { MessageSquare, Send } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Keyboard,
  type KeyboardEvent,
  type KeyboardEventEasing,
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
import { MAX_NOTE_BODY_LENGTH } from '../../../../lib/api';

const NOTE_INPUT_MIN_HEIGHT = 52;
const NOTE_INPUT_MAX_HEIGHT = 168;

// Maps iOS's reported keyboard animation curve to an Easing function so our
// manual composer animation matches the system keyboard's curve, not just
// its duration.
function keyboardEasing(easing: KeyboardEventEasing): (value: number) => number {
  switch (easing) {
    case 'easeIn':
      return Easing.in(Easing.ease);
    case 'easeOut':
      return Easing.out(Easing.ease);
    case 'linear':
      return Easing.linear;
    case 'easeInEaseOut':
    case 'keyboard':
    default:
      // iOS reports the system keyboard's motion as 'keyboard' (its private
      // UIViewAnimationCurve 7) or 'easeInEaseOut'. Neither is a symmetric
      // ease-in-out — that has near-zero velocity at the start, which reads
      // as a stall before the composer moves. The keyboard itself starts
      // at full speed and decelerates smoothly into place, like something
      // being shoved and settling — a plain ease-out cubic.
      return Easing.out(Easing.cubic);
  }
}

export default function ProjectNotesScreen() {
  const { id, source } = useLocalSearchParams<{ id: string; source?: string }>();
  const { color, mode } = useTheme();
  const { language, t } = useI18n();
  const styles = createStyles(color, mode);
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
  // The input otherwise sizes itself to content natively (no JS height
  // state — see the commit that removed the onContentSizeChange-driven
  // version). That's fine for growing, but a native multiline view doesn't
  // reliably re-measure itself back down the instant its content is
  // cleared programmatically, so right after a send it can sit expanded
  // for a beat with nothing left in it. This is a one-shot explicit
  // override for exactly that moment: force compact immediately on send,
  // then drop the override on the next keystroke so auto-grow resumes.
  const [forceCompact, setForceCompact] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  // The store returns notes oldest-to-newest so the newest message stays
  // closest to the composer, like a normal chat timeline.
  const orderedNotes = notes;

  // Drives the composer (background + input + button, as one native view)
  // up above the keyboard via transform rather than KeyboardAvoidingView's
  // padding. KeyboardAvoidingView recomputes an async accessibility check
  // before it calls LayoutAnimation, so its animation can start a beat after
  // the real keyboard does, and LayoutAnimation doesn't reliably animate a
  // TextInput's native frame on its own — both show up as the input
  // reaching its final position before its background catches up. A single
  // native-driven transform on one view removes that race entirely.
  const composerOffset = useRef(new Animated.Value(0)).current;
  // This screen sits inside the bottom tab navigator, which keeps the tab
  // bar mounted underneath it — so the composer's resting position is above
  // the tab bar, not flush with the real screen edge. Translating up by the
  // full reported keyboard height overshoots by the tab bar's height. We
  // measure the composer's actual on-screen frame and only close the real
  // gap to the keyboard, same as KeyboardAvoidingView itself computes it.
  const composerFrame = useRef<{ y: number; height: number } | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    const animateTo = (event: KeyboardEvent, toValue: number) => {
      Animated.timing(composerOffset, {
        toValue,
        duration: event.duration > 10 ? event.duration : 250,
        easing: keyboardEasing(event.easing),
        useNativeDriver: true,
      }).start();
    };

    const showSub = Keyboard.addListener('keyboardWillShow', (event) => {
      const frame = composerFrame.current;
      if (!frame) return;
      const overlap = Math.max(frame.y + frame.height - event.endCoordinates.screenY, 0);
      animateTo(event, -overlap);
    });
    const hideSub = Keyboard.addListener('keyboardWillHide', (event) => {
      animateTo(event, 0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [composerOffset]);

  // Scroll to the newest message only when the note count actually changes,
  // not on every ScrollView content-size change — the keyboard opening also
  // resizes the scrollable area (via automaticallyAdjustKeyboardInsets), and
  // an unconditional scrollToEnd on that fought the keyboard's own smooth
  // animation with an instant, unanimated jump on every frame.
  //
  // This is also the single, sole place that scrolls to the newest message —
  // it used to be duplicated (a local call in handleSend, plus a
  // resize-triggered one), and having several uncoordinated scrollToEnd
  // calls land on different frames was itself producing a stale scroll
  // position (a gap below the last message until a manual scroll forced a
  // recompute). One rAF wasn't consistently enough time for the composer's
  // post-send shrink to land in a completed layout pass, so this waits two.
  useEffect(() => {
    if (notes.length === 0) return;
    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        scrollRef.current?.scrollToEnd({ animated: false });
      });
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      if (secondFrame) cancelAnimationFrame(secondFrame);
    };
  }, [notes.length]);

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
    if (draft.length > MAX_NOTE_BODY_LENGTH) {
      setPostError(t('notes.tooLong'));
      return;
    }

    setPostError('');
    setPosting(true);
    // Keep the untrimmed draft in the input. The server normalizes the value,
    // but a failed request must never make the user's composed text disappear.
    const result = await postNote(id, draft, token);
    setPosting(false);
    if (!result.ok) {
      const serverRejectedLength = result.status === 400 &&
        (draft.length > MAX_NOTE_BODY_LENGTH || /10[,.]?000|10000/.test(result.message));
      if (serverRejectedLength) {
        setPostError(t('notes.tooLong'));
        return;
      }
      setPostError(t('notes.postFailed'));
      return;
    }

    setDraft('');
    setForceCompact(true);
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
    <View style={styles.flex}>
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
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
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

      <Animated.View
        onLayout={(event) => {
          const { y, height } = event.nativeEvent.layout;
          composerFrame.current = { y, height };
        }}
        style={{
          backgroundColor: color.surface,
          transform: [{ translateY: composerOffset }],
        }}
      >
        <View style={styles.composer}>
          {postError ? <Text style={styles.error}>{postError}</Text> : null}
          <View style={styles.composerRow}>
            <TextInput
              value={draft}
              onChangeText={(value) => {
                setDraft(value);
                if (forceCompact) setForceCompact(false);
                if (postError) setPostError('');
              }}
              placeholder={t('notes.writeNote')}
              placeholderTextColor={color.textMuted}
              style={[
                styles.input,
                inputFocused && styles.inputFocused,
                forceCompact && { height: NOTE_INPUT_MIN_HEIGHT },
              ]}
              multiline
              editable={!posting}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              scrollEnabled
            />
            <Pressable
              onPress={() => void handleSend()}
              disabled={!draft.trim() || draft.length > MAX_NOTE_BODY_LENGTH || posting}
              accessibilityRole="button"
              accessibilityLabel={t('common.send')}
              style={({ pressed }) => [
                styles.sendButton,
                (!draft.trim() || draft.length > MAX_NOTE_BODY_LENGTH || posting) && styles.sendButtonDisabled,
                pressed && draft.trim().length > 0 && draft.length <= MAX_NOTE_BODY_LENGTH && !posting && styles.sendButtonPressed,
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
      </Animated.View>
    </View>
  );
}

function createStyles(color: ReturnType<typeof useTheme>['color'], mode: ReturnType<typeof useTheme>['mode']) {
  // A plain neutral gray, not the app's sage-tinted border tokens: this
  // separator sits directly under the header title and reads as an
  // off-color green tint at that size if it shares the tinted palette.
  const separator = mode === 'dark' ? '#454545' : '#D8D8D8';
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
    color: color.danger,
    marginBottom: spacing.md,
  },
  stickyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: color.canvas,
    borderBottomWidth: 1,
    borderBottomColor: separator,
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
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: NOTE_INPUT_MIN_HEIGHT,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.body,
    color: color.textPrimary,
    borderRadius: radius.md,
    // Horizontal and vertical padding both stay >= borderRadius so a long,
    // scrolled message never slides under the rounded corners — at the very
    // top and bottom edges the corner curve eats into anything inside the
    // radius, which was clipping the first and last visible lines of text.
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    textAlignVertical: 'top',
    backgroundColor: color.surfaceMuted,
    maxHeight: NOTE_INPUT_MAX_HEIGHT,
  },
  inputFocused: {
    backgroundColor: color.surface,
  },
  sendButton: {
    // Square, sized to the composer input's resting height and sharing its
    // corner radius so the button reads as the same control as the field
    // beside it rather than a smaller pill floating next to it.
    width: NOTE_INPUT_MIN_HEIGHT,
    height: NOTE_INPUT_MIN_HEIGHT,
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
