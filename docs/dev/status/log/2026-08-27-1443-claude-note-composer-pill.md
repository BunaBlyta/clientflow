# 2026-08-27 14:43 — Claude Code — pill-shaped note composer with contour text wrap

## Task

Buna, on the CRM web project-detail page: the "add a note" field is a pill
(every CRM input is forced to `border-radius: 999px` in `globals.css`). On a
multi-line note the text ran into the rounded ends. Buna's final spec: keep the
pill, and make the text wrap to the pill's shape — short lines near the rounded
top/bottom, full width through the middle, re-wrapping as the field grows, so
the text block reads as a smaller pill nested inside the field.

Several earlier padding-only attempts this thread were dead ends — uniform
padding can't do this, and the padding needed keeps growing with the field.

## What shipped

New `components/dashboard/note-composer.tsx` — a `contentEditable`
(`plaintext-only`) field, not a `<textarea>` (a textarea can only lay text out
as a rectangle). Two `aria-hidden` `<div>`s float left and right inside the
pill; each has a `shape-outside` polygon tracing the crescent between the
field's straight edge and the inner curve of that end's cap. Text wraps around
those crescents, so it follows the stadium contour.

- A `ResizeObserver` on the editable keeps the pill height, the float heights,
  and the polygons in sync as the note grows. Converges in a frame or two; a
  0.5px guard stops it oscillating.
- `border-radius: 999px` always resolves to half the height for a pill, and the
  polygons use exactly `height / 2`, so the text boundary and the visible curve
  always match at any height.
- Plain-text paste, click-anywhere-to-focus (caret to end), `:empty` placeholder
  via `data-placeholder`, disabled state. Parent still owns the value; the
  component only writes back to the DOM on the post-submit clear.
- `page.tsx`: swapped the `<Textarea>` for `<NoteComposer>`; dropped the now
  unused `Textarea` import. `globals.css` was NOT touched — the pill styling it
  applies is what we want.

## Verification

- `npx tsc --noEmit` — passes.
- `npx next build` — passes (`/dashboard/projects/[id]` builds clean).
- `npm run lint` still reports the same 2 pre-existing errors in other lanes'
  files (`components/dashboard/settings-content.tsx:33`,
  `components/dashboard/date-picker.tsx:45`) and 2 img warnings in
  `components/marketing/mobile-app-section.tsx`. None are mine; `eslint`
  exiting non-zero on them is why `npm run verify` stops before `next build`,
  so `next build` was run directly. Flagging for the web lane.
- Checked in the running dev app: empty placeholder, single line vertically
  centred, and 2–3 line notes visibly tuck the first/last lines in on both
  sides while the middle line runs full width. No console errors, no
  ResizeObserver-loop warning.

## Note on lanes

`components/` and `app/(dashboard)/` are the web lane's (Agent B). Buna asked
for this directly and repeatedly in-session. New file + a ~6-line swap in
page.tsx. Did not touch `status/CURRENT-web.md`.
