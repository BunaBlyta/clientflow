# 2026-08-27 16:15 — Claude Code — match send button to the composer text field

## Task

"Match the send button to the textfield in chat interface."

## Change

`app/(app)/projects/[id]/notes.tsx` — the project notes chat composer.

The send button was a 46×46 square while the text field's resting height is
52px, so it sat noticeably shorter than the field beside it. Set the button
to `NOTE_INPUT_MIN_HEIGHT` (52) square. It already shared the field's
`radius.md` corner radius, so the two controls now read as the same size and
shape, aligned along their bottom edge (the row is `alignItems: 'flex-end'`,
so the button stays pinned to the bottom as the field grows with a long
draft).

## Verification

- `npx tsc --noEmit` from `mobile/` — passes.
- Not checked on a device/simulator (none available this session).
