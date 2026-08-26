# Mobile: fixed invisible timestamp on sent chat bubbles

- User reported they couldn't see the time on sent texts in the project Notes chat.
- Root cause: `components/NoteBubble.tsx`'s `clientTime` style (the timestamp inside a sent/client bubble) used `color.textMuted` — a muted gray meant to sit on light `surface`-type backgrounds. Sent bubbles use a solid `color.accent` fill (the body text already correctly switches to `color.textOnAccent`/white for contrast), so the muted gray timestamp was low-to-no contrast against it.
- Fix: `clientTime` now uses `color.textOnAccent` (white) at `opacity: 0.75`, matching the pattern of "white but visually secondary" rather than reusing the light-surface muted color.
- Verified with `npx tsc --noEmit` from `mobile/`. Not run on a device/simulator this session — no visual confirmation, but the root cause (wrong color token for the background it renders on) is unambiguous from the code.
- Committed `mobile/components/NoteBubble.tsx`; it also carried unrelated pending translation-string work already uncommitted in that file, consistent with the user's earlier go-ahead to bundle that in.
