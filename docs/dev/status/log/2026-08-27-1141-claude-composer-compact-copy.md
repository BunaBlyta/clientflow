# 2026-08-27 11:41 — Claude Code (mobile) — composer auto-compact fix + copy message

User reported that after sending a large text in the notes composer, the text box stayed expanded until tapped again instead of auto-compacting, and asked for a way to copy a message.

## Composer stuck expanded after send

Codex's earlier fix this session (commit `96c0604`) made the composer's native height track content size and explicitly reset to compact height (`setInputHeight(NOTE_INPUT_MIN_HEIGHT)`) right after a successful send. That reset itself is correct, but the native multiline `TextInput` can still fire a stray `onContentSizeChange` event shortly afterward reporting the *pre-clear* (large) content's measured height — a genuine race between the native layout/measurement pass and the JS-side reset, not a stale React closure (the `draft.length === 0` guard already in place does use the current value). That straggler event would silently grow `inputHeight` back up, and since nothing else re-triggers a measurement, it stayed expanded until the user tapped in and refocused, which forces a fresh native layout pass.

Fix (`app/(app)/projects/[id]/notes.tsx`): added a `suppressContentSize` ref. Set to `true` right when `handleSend` resets the height on success; set back to `false` in `onChangeText`, i.e. the moment the user actually edits the input again. While suppressed, `onContentSizeChange` is a no-op. This is semantic rather than time-based (no arbitrary debounce window) — it ignores stray reports for exactly as long as there's no new real content to measure, and self-corrects the instant the user types.

## Copy message

Added long-press-to-copy on chat bubbles (`components/NoteBubble.tsx`): the message body is now wrapped in a `Pressable` with `onLongPress` that copies the currently displayed (translated) text via `react-native`'s core `Clipboard` API. That API is deprecated in favor of `@react-native-clipboard/clipboard` (prints a one-time `console.warn`) but its native implementation is still bundled in this installed `react-native` version (0.86.2) on both iOS and Android — confirmed by checking for `RCTClipboard.mm` / `ClipboardModule.kt` in `node_modules/react-native` before using it, so no new package install was needed (installs are Buna's call per AGENTS.md).

Confirmation UX: the message timestamp briefly swaps to a localized "Copied" label for 1.5s instead of adding a new UI element (toast/pill), matching the app's restrained design language. Copy is disabled on `preview` bubbles (e.g. Home's recent-activity card) since those aren't the real chat context. Added `notes.copyMessage` / `notes.copied` translation keys for all three locales (en/sq/de) in `lib/i18n.ts`.

## Verification

- `npx tsc --noEmit` from `mobile/`: clean.
- Not verified on a physical device/simulator — no device/simulator connection was available this session. In particular, long-press-to-copy timing/feel and the Clipboard API's actual runtime behavior on-device should be spot-checked.

## Note on concurrent lane usage

`status/CURRENT-mobile.md` is being actively written by both Codex (assigned mobile lane) and this Claude Code session today. Git history shows both sides committing cleanly in sequence with no working-tree collisions so far (each commit is small and scoped), but the status file itself gets fully overwritten by whichever session writes last, per the "overwrite your own lane's file" rule — this update folds Codex's most recent on-disk state (notifications pagination/archive, `/api/translate` dependency, login `.env` finding) into one merged current-state doc rather than discarding it, but that's a manual reconciliation each time, not a structural fix.
