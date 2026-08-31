# 2026-08-27 18:35 — Claude Code — optimistic note sending + delivery indicator

Buna: sending a note shows a spinner for a beat; it should look sent
immediately, then get a separate "delivered" indicator.

## Change

`app/(app)/projects/[id]/notes.tsx` + `components/NoteBubble.tsx`.

- Local `outbox: OutboxItem[]` on the notes screen. `handleSend` is now
  synchronous: it pushes an item (`state: 'sending'`), clears the draft, and
  fires `deliver()` in the background. The message is in the timeline before
  the request starts.
- `deliver()` calls `postNote`; on success flips the item to `'sent'` (records
  the real note id), on failure to `'failed'`.
- The confirmed store note is hidden (`settledNoteIds`) while its optimistic
  twin still shows the "Sent" tick; after `SENT_INDICATOR_MS` (2.6s) the
  outbox item is dropped and the real note takes its place — same position,
  no visible swap.
- `NoteBubble` gained `status?: 'sending' | 'sent' | 'failed'` and `onRetry`.
  With a status it renders a delivery line instead of the timestamp:
  "Sending…" → "Sent" + check → "Not sent — tap to retry" + a red bubble
  that's tappable to re-send.
- Send button lost its `ActivityIndicator` / `posting` state — the draft
  clears instantly so the button disables itself, and there's nothing to
  wait on.
- i18n: `notes.sending` / `notes.sent` / `notes.sendRetry` in en / sq / de.

## Verify

- `npx tsc --noEmit` from `mobile/` — clean.
- Not run on device. Check: send with network on (bubble appears, "Sending…"
  → "Sent" → settles), send with the API unreachable (bubble goes red,
  tap retries), send several fast in a row.

## 2026-08-27 18:50 — follow-up: composer overlap

The composer floats up over the ScrollView via transform when the keyboard
opens, so the newest messages sat behind the composer strip (very visible now
that a sent message lands there instantly). Added a parallel JS-driven
animated spacer (`contentPush`) as the last child of the scroll content: 0 at
rest, composer height when the keyboard is up. `automaticallyAdjustKeyboardInsets`
still clears the keyboard; the spacer adds the extra room to also clear the
floated composer. Android path (adjustResize, composer is a flex sibling)
unchanged.

## 2026-08-27 18:58 — follow-up: composer tap target

Only a direct tap on the `TextInput` raised the keyboard. Wrapped the composer
strip in a `Pressable` (`onPress` -> `inputRef.focus()`) so tapping its padding
or the gap next to the field also brings it (and the keyboard) up.

## 2026-08-27 19:15 — composer never overlaps (rework)

The spacer approach still let the composer draw over messages in edge timings
because the composer was `translateY`-transformed over the ScrollView. Reworked:
the composer is a plain flex sibling again (no transform), and the keyboard is
cleared by animating `paddingBottom` on the screen root — the whole screen
shrinks from the bottom, the ScrollView shrinks with it, and the composer sits
at the new bottom edge. The list physically ends where the composer starts, so
overlap is structurally impossible. Driven straight off `keyboardWillShow/Hide`
(event duration + curve) so there is no KeyboardAvoidingView start-lag. Removed
`automaticallyAdjustKeyboardInsets` and the `contentPush` spacer. `keyboardWillShow`
also animates a `scrollToEnd`. Android (`adjustResize`, composer already a flex
sibling) unchanged.

## 2026-08-27 19:35 — bottom gap fix

The lift amount is now measured via `composerRef.measureInWindow` (true window
coords) instead of `onLayout` y (root-relative) — the latter under-shot if the
screen root was not at window y=0, leaving a strip of background below the
composer. The lift is now a `color.surface` spacer rendered *below* the
composer (grows -> pushes composer + shrinks ScrollView), not root padding, so
any sub-pixel measurement error shows as the composer extending down rather
than a coloured gap. Resting layout is byte-identical (spacer height 0).
