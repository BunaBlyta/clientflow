# 2026-08-27 15:01 — Claude Code — activity feed redesign + note composer caret alignment

Follow-up to `2026-08-27-1443-claude-note-composer-pill.md` (the pill NoteComposer).
Two changes, both in `app/(dashboard)/dashboard/projects/[id]/page.tsx` and
`components/dashboard/note-composer.tsx`.

## 1. Composer: caret and placeholder now share one origin

Buna: when the empty field was focused, the caret sat hard against the left
edge while the placeholder text was pushed inward by the cap curve — they
should meet.

- Every line of text, the caret, and the placeholder now sit at a fixed 14px
  inset from the edge (`EDGE_INSET`, applied as the editable's `padding-inline`).
- The text block is vertically centred in the pill (editable + float gutters
  wrapped in a centred `flow-root` container), so a single empty line sits at
  the pill's mid-height where the caps barely curve, instead of at the top
  where the curve is deepest.
- The cap polygons now measure against the pill's real radius with the
  centring offset applied, so the contour tuck-in on multi-line notes still
  tracks the visible edge exactly.

## 2. Activity feed: separation + author colour-coding

Buna: the feed was a flat wall of text, wanted it cleaner to look at.

- **Person entries** get a 28px initials avatar in a left gutter. Client notes
  use an accent-tinted avatar (`bg-brand-accent/15`), staff notes a neutral
  one — so "us or the client" is readable at a glance without a badge on every
  row.
- **System entries** (status changes) render with an arrow icon in the same
  gutter, italic + muted, timestamp inline — they read as quiet log events and
  punctuate the timeline.
- **Date separators**: a hairline rule with the date whenever the day changes.
- Note bodies switched to `whitespace-pre-wrap`, so a real multi-paragraph
  client message renders with its paragraph breaks instead of collapsing to
  one blob.

Stays within the Linear-style restraint in AGENTS.md — no bubbles, no per-row
badges, single dashboard accent used only for the client/studio distinction.

## Verification

- `npx tsc --noEmit` — passes.
- `npx next build` — passes.
- `npx eslint` on both changed files — clean.
- `npm run lint` still surfaces the same 2 pre-existing errors in other lanes'
  files (`settings-content.tsx:33`, `date-picker.tsx:45`) + 2 img warnings —
  not mine, unchanged.
- Checked in the running dev app: empty field reads as one point; 2–3 line and
  long notes keep the contour wrap; feed shows avatars (accent vs neutral),
  system arrow rows, and date rules. No console errors.

## Lanes

`components/` and `app/(dashboard)/` are the web lane's (Agent B). Buna asked
for all of this directly and repeatedly in-session. Did not touch
`status/CURRENT-web.md`.
