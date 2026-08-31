import { useLocalSearchParams } from 'expo-router';
import { MessageSquare, Send } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
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
import { NoteBubbleSkeleton } from '../../../../components/ui/Skeleton';
import { formatDate } from '../../../../lib/format';
import { AtmosphereBackground } from '../../../../components/ui/AtmosphereBackground';
import { fontFamily, fontSize, radius, spacing, useTheme } from '../../../../lib/theme';
import { useI18n } from '../../../../lib/i18n';
import { useAuthStore } from '../../../../store/auth-store';
import { useDataStore } from '../../../../store/data-store';
import { useShallow } from 'zustand/react/shallow';
import { AppBackButton } from '../../../../components/OriginBackButton';
import { MAX_NOTE_BODY_LENGTH } from '../../../../lib/api';
import { TAB_BAR_SIDE_MARGIN } from '../../../../lib/tab-bar';
import type { Note as NoteType } from '../../../../lib/types';

// The visible affordance is the input capsule itself (the composer row has no
// background of its own, like the tab bar's container) — this is its resting
// height and it doubles as the send button's diameter so the two line up.
const NOTE_INPUT_MIN_HEIGHT = 44;
const NOTE_INPUT_MAX_HEIGHT = 168;
const NOTE_SEND_BUTTON_SIZE = NOTE_INPUT_MIN_HEIGHT;

// How long a delivered message keeps showing its "Sent" tick before the
// confirmed store note quietly takes its place.
const SENT_INDICATOR_MS = 2600;

type OutboxItem = {
  tempId: string;
  body: string;
  createdAt: string;
  state: 'sending' | 'sent' | 'failed';
  // The real note id once the server confirms — used to hide the duplicate
  // store note while the "Sent" tick is still showing.
  noteId?: string;
};

function keyboardMotionEasing(easing: KeyboardEventEasing): (value: number) => number {
  switch (easing) {
    case 'linear':
      return Easing.linear;
    case 'easeIn':
      return Easing.in(Easing.cubic);
    case 'easeOut':
      return Easing.out(Easing.cubic);
    case 'easeInEaseOut':
      return Easing.inOut(Easing.cubic);
    case 'keyboard':
    default:
      // iOS exposes its private keyboard curve by name. A decelerating cubic
      // is the closest Animated equivalent and, unlike a layout animation,
      // can run entirely on the native driver alongside the keyboard.
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

  const client = useAuthStore((s) => s.client);

  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  // Messages the user has sent that aren't confirmed by the server yet. They
  // render in the timeline immediately with a delivery indicator, so sending
  // feels instant instead of showing a spinner on the button.
  const [outbox, setOutbox] = useState<OutboxItem[]>([]);
  const [unreachable, setUnreachable] = useState(false);
  const [postError, setPostError] = useState('');
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
  const inputRef = useRef<TextInput>(null);
  const chatLift = useRef(new Animated.Value(0)).current;
  // The store returns notes oldest-to-newest so the newest message stays
  // closest to the composer, like a normal chat timeline.
  const orderedNotes = notes;

  // Move the whole chat surface on the native animation driver as soon as iOS
  // announces the keyboard's next frame. This avoids waiting for a React
  // layout pass (the visible lag in KeyboardAvoidingView) and keeps the list
  // and composer locked together throughout the keyboard animation. Android's
  // window already resizes natively, so it needs no parallel transform.
  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    const animateToKeyboardFrame = (event: KeyboardEvent, forceHidden = false) => {
      const screenHeight = Dimensions.get('screen').height;
      const keyboardHeight = forceHidden
        ? 0
        : Math.max(screenHeight - event.endCoordinates.screenY, 0);

      if (event.duration <= 10) {
        chatLift.setValue(-keyboardHeight);
        return;
      }

      Animated.timing(chatLift, {
        toValue: -keyboardHeight,
        duration: event.duration,
        easing: keyboardMotionEasing(event.easing),
        useNativeDriver: true,
      }).start();
    };

    const frameSub = Keyboard.addListener('keyboardWillChangeFrame', (event) => {
      animateToKeyboardFrame(event);
    });
    // A floating/undocked keyboard can report a final frame-change before its
    // hide event. This fallback guarantees the chat returns exactly to rest.
    const hideSub = Keyboard.addListener('keyboardWillHide', (event) => {
      animateToKeyboardFrame(event, true);
    });

    return () => {
      frameSub.remove();
      hideSub.remove();
    };
  }, [chatLift]);

  // Scroll to the newest message when the message count changes. One rAF wasn't
  // consistently enough time for the composer's post-send shrink to land in a
  // completed layout pass, so this waits two.
  useEffect(() => {
    if (notes.length === 0 && outbox.length === 0) return;
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
  }, [notes.length, outbox.length]);

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

  async function deliver(tempId: string, bodyText: string) {
    if (!id || !token) return;
    setOutbox((list) =>
      list.map((item) => (item.tempId === tempId ? { ...item, state: 'sending' } : item)),
    );
    const result = await postNote(id, bodyText, token);
    if (!result.ok) {
      const serverRejectedLength =
        result.status === 400 &&
        (bodyText.length > MAX_NOTE_BODY_LENGTH || /10[,.]?000|10000/.test(result.message));
      setOutbox((list) =>
        list.map((item) => (item.tempId === tempId ? { ...item, state: 'failed' } : item)),
      );
      // The failed bubble itself carries a retry affordance; only the
      // length rejection needs the explainer banner.
      if (serverRejectedLength) setPostError(t('notes.tooLong'));
      return;
    }
    const noteId = result.note.id;
    setOutbox((list) =>
      list.map((item) =>
        item.tempId === tempId ? { ...item, state: 'sent', noteId } : item,
      ),
    );
    // Once the "Sent" tick has shown for a moment, drop the optimistic copy;
    // the confirmed store note is already in the timeline underneath it.
    setTimeout(() => {
      setOutbox((list) => list.filter((item) => item.tempId !== tempId));
    }, SENT_INDICATOR_MS);
  }

  function handleSend() {
    const bodyText = draft;
    if (!bodyText.trim() || !id || !token) return;
    if (bodyText.length > MAX_NOTE_BODY_LENGTH) {
      setPostError(t('notes.tooLong'));
      return;
    }
    setPostError('');
    const tempId = `outbox-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setOutbox((list) => [
      ...list,
      { tempId, body: bodyText, createdAt: new Date().toISOString(), state: 'sending' },
    ]);
    setDraft('');
    setForceCompact(true);
    void deliver(tempId, bodyText);
  }

  function handleRetry(item: OutboxItem) {
    setPostError('');
    void deliver(item.tempId, item.body);
  }

  function outboxNote(item: OutboxItem): NoteType {
    return {
      id: item.tempId,
      projectId: id ?? '',
      authorId: client?.id ?? null,
      authorName: client?.name ?? t('notes.you'),
      authorRole: 'CLIENT',
      body: item.body,
      createdAt: item.createdAt,
    };
  }

  const settledNoteIds = new Set(
    outbox.map((item) => item.noteId).filter((value): value is string => Boolean(value)),
  );
  const timelineNotes = orderedNotes.filter((note) => !settledNoteIds.has(note.id));
  const hasContent = timelineNotes.length > 0 || outbox.length > 0;

  if (loading && notes.length === 0 && outbox.length === 0) {
    return (
      <View style={styles.flex}>
        <AtmosphereBackground />
        {notesHeader}
        <View style={styles.content}>
          <NoteBubbleSkeleton />
          <NoteBubbleSkeleton mine />
          <NoteBubbleSkeleton />
          <NoteBubbleSkeleton mine />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <AtmosphereBackground />
      {notesHeader}
      {/* Clipping the translated surface at the fixed header keeps old
          messages from sliding over it while the keyboard opens. */}
      <View style={styles.keyboardViewport}>
        <Animated.View
          style={[
            styles.flex,
            Platform.OS === 'ios' && { transform: [{ translateY: chatLift }] },
          ]}
        >
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          // Initial/message-layout changes still anchor to the newest item.
          // Keyboard movement itself uses a transform, so the timeline and
          // composer retain their exact relative positions during the rise.
          onLayout={() => {
            requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: false }));
          }}
          contentContainerStyle={[
            styles.content,
            // Pin messages to the bottom, just above the composer, the way a
            // chat does. The native transform preserves that relationship
            // throughout keyboard movement. (No effect once the thread is long
            // enough to fill the viewport — it just scrolls.)
            { flexGrow: 1, justifyContent: 'flex-end' },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          showsVerticalScrollIndicator={false}
        >
          {unreachable && (
            <Text style={styles.error}>
              {t('notes.unavailable')}
            </Text>
          )}
          {!hasContent ? (
            <View style={styles.emptyState}>
              <EmptyState
                icon={MessageSquare}
                title={t('notes.noNotes')}
                subtitle={t('notes.emptySubtitle')}
              />
            </View>
          ) : (
            <View style={styles.timeline}>
              {timelineNotes.map((note, index) => {
                const previousNote = timelineNotes[index - 1];
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
              {outbox.map((item, index) => {
                const previous = index === 0
                  ? timelineNotes[timelineNotes.length - 1]
                  : undefined;
                const itemDate = formatDate(item.createdAt, language);
                const showDate =
                  index === 0 &&
                  (!previous || formatDate(previous.createdAt, language) !== itemDate);
                return (
                  <View key={item.tempId}>
                    {showDate && (
                      <View style={styles.dateSeparator}>
                        <View style={styles.dateLine} />
                        <Text style={styles.dateLabel}>{itemDate}</Text>
                        <View style={styles.dateLine} />
                      </View>
                    )}
                    <NoteBubble
                      note={outboxNote(item)}
                      showAuthor={false}
                      status={item.state}
                      onRetry={() => handleRetry(item)}
                    />
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        <View style={styles.composerWrap}>
          <Pressable
            style={styles.composer}
            // Tapping anywhere on the pill (its padding, the gap beside the
            // field) focuses the field, so the keyboard and composer come up.
            onPress={() => inputRef.current?.focus()}
            accessibilityRole="none"
          >
            {postError ? <Text style={styles.error}>{postError}</Text> : null}
            <View style={styles.composerRow}>
              <TextInput
                ref={inputRef}
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
                  forceCompact && { height: NOTE_INPUT_MIN_HEIGHT },
                ]}
                multiline
                scrollEnabled
              />
              <Pressable
                onPress={handleSend}
                disabled={!draft.trim() || draft.length > MAX_NOTE_BODY_LENGTH}
                accessibilityRole="button"
                accessibilityLabel={t('common.send')}
                style={({ pressed }) => [
                  styles.sendButton,
                  (!draft.trim() || draft.length > MAX_NOTE_BODY_LENGTH) && styles.sendButtonDisabled,
                  pressed && draft.trim().length > 0 && draft.length <= MAX_NOTE_BODY_LENGTH && styles.sendButtonPressed,
                ]}
              >
                {/* The glyph's ink sits low-left of its box; nudge it back to
                    the optical centre of the circle. */}
                <Send size={16} color={color.textOnAccent} style={styles.sendIcon} />
              </Pressable>
            </View>
          </Pressable>
        </View>
        </Animated.View>
      </View>
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
  keyboardViewport: {
    flex: 1,
    overflow: 'hidden',
  },
  content: {
    paddingHorizontal: spacing.lg,
    // Small — the composer is a real sibling below the list now, so it already
    // ends where the composer begins; this is just breathing room.
    paddingBottom: spacing.sm,
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
  // Same side margin from the screen edge as the tab bar pill. `paddingTop`
  // keeps it clear of the last message; `paddingBottom` is the gap below the
  // capsule — at rest it's the distance from the screen edge, and after the
  // native keyboard lift it's the gap above the keyboard.
  composerWrap: {
    paddingHorizontal: TAB_BAR_SIDE_MARGIN,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  // No background or shadow of its own — like the tab bar's container, only
  // the control inside it (the input capsule) is a visible surface.
  composer: {
    justifyContent: 'center',
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: NOTE_INPUT_MIN_HEIGHT,
    maxHeight: NOTE_INPUT_MAX_HEIGHT,
    // Fixed radius (half the resting height) so it's a clean capsule at one
    // line and a rounded rectangle once it grows, never a swelling stadium.
    borderRadius: NOTE_INPUT_MIN_HEIGHT / 2,
    backgroundColor: color.navBackground,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.body,
    color: color.textPrimary,
    textAlignVertical: 'top',
  },
  sendButton: {
    width: NOTE_SEND_BUTTON_SIZE,
    height: NOTE_SEND_BUTTON_SIZE,
    borderRadius: NOTE_SEND_BUTTON_SIZE / 2,
    backgroundColor: color.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    transform: [{ translateX: 1 }],
  },
  sendButtonPressed: {
    opacity: 0.78,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  });
}
