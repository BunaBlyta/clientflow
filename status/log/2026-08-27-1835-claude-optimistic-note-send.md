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
