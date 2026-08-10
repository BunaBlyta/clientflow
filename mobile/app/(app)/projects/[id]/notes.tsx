import { useLocalSearchParams } from 'expo-router';
import { MessageSquare, Send } from 'lucide-react-native';
import { useRef, useState } from 'react';
import {
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
import { color, fontFamily, fontSize, radius, spacing } from '../../../../lib/theme';
import { useAuthStore } from '../../../../store/auth-store';
import { useDataStore } from '../../../../store/data-store';

export default function ProjectNotesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const client = useAuthStore((s) => s.client);
  const notes = useDataStore((s) => s.notesForProject(id));
  const addNote = useDataStore((s) => s.addNote);

  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  function handleSend() {
    const text = draft.trim();
    if (!text || !client) return;
    addNote(id, text, client.name);
    setDraft('');
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
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
        <Text style={styles.intro}>
          A shared, permanent record between you and the studio. Notes can't be
          edited or deleted once posted.
        </Text>
        {notes.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No notes yet"
            subtitle="Post an update or question below — the studio team will see it."
          />
        ) : (
          notes.map((note) => <NoteBubble key={note.id} note={note} />)
        )}
      </ScrollView>

      <View style={styles.composer}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Write a note…"
          placeholderTextColor={color.textMuted}
          style={styles.input}
          multiline
        />
        <Pressable
          onPress={handleSend}
          disabled={!draft.trim()}
          style={[styles.sendButton, !draft.trim() && styles.sendButtonDisabled]}
        >
          <Send size={16} color={color.textOnAccent} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: color.background },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  intro: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.meta,
    color: color.textMuted,
    marginBottom: spacing.lg,
    lineHeight: 17,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.border,
    backgroundColor: color.surface,
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
