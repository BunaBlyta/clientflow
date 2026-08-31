# 2026-08-31 10:00 — Claude Code — notes composer out from under the tab bar

## Problem (reported by Buna, in order over several passes)

1. The message compose strip on the project chat (notes) screen was covered by
   the floating pill tab bar — its bottom edge and the send button sat behind it.
2. First fix (add tab-bar clearance below the composer) left too big a gap and
   the keyboard still covered the strip.
3. Buna's steer: on this screen, hide the tab bar and let the composer take its
   place; it should be a pill matching the tab bar, it should push the chat up,
   and it should sit exactly where the tab bar sits (not higher).
4. Then: the pill shouldn't read as a box — the tab bar doesn't; the send button
   glyph looked off-centre; and when the keyboard opened the whole screen wasn't
   moving up, leaving the composer stranded / a chunk of background below it.
5. Then: don't jam the composer flush against the keyboard (ugly) — small gap —
   and the screen being pushed up entirely is non-negotiable.

## What changed

### `app/(app)/_layout.tsx`
- `usePathname()` + `hideTabBar = pathname.endsWith('/notes')`.
- `tabBarStyle` gains `display: hideTabBar ? 'none' : 'flex'`. Covers both
  `/projects/[id]/notes` and `/notifications/projects/[id]/notes`.

### `app/(app)/projects/[id]/notes.tsx`
- Removed the old keyboard mechanism (measure-composer-in-window + surface-
  coloured spacer sized to a tab-bar clearance).
- Composer is now a plain flex row **below** the ScrollView (never overlaps the
  list): a rounded **input capsule** (`navBackground`, fixed radius = half its
  44px resting height) + a **round send button** (44px). No card, box, border,
  or shadow around the row — matching how the tab bar container has no
  background behind its icons.
- Message list content is **bottom-pinned**: `contentContainerStyle` gets
  `justifyContent: 'flex-end'`. Short threads now sit just above the composer
  instead of at the top with dead space below.
- Keyboard handling (iOS `keyboardWillShow`/`WillHide`): a **transparent
  animated spacer** rendered below the composer. Rests at `TAB_BAR_BOTTOM_MARGIN`
  (so the composer sits exactly where the tab bar pill's bottom was). On show it
  animates to `endCoordinates.height + spacing.md` — the list shrinks from the
  bottom, carrying the bottom-pinned messages and the composer up together, and
  the composer lands ~12px above the keyboard (not flush). Driven straight off
  the keyboard event for matching duration/curve.
- Send glyph nudged `translateX: 1` — lucide's `Send` ink sits low-left of its
  box.
- Dropped now-unused `inputFocused` state and the `bottom`/`composerDock`
  absolute-positioning experiment from an earlier pass in this session.

## Verified

- iOS simulator (deep-linked to `clientflow:///projects/<id>/notes`), light and
  dark, short and long threads: composer renders as capsule + button with no
  box, bottom-pinned messages, resting position matches the tab bar's.
- **Not** verified: the keyboard-open animation itself — could not drive a tap
  into the simulator this session (no accessibility permission for osascript,
  no idb). Buna to eyeball the rise + the 12px gap on device/simulator.

## Checks

- `npx tsc --noEmit` from `mobile/` — passes.
- Not committed by this task: `mobile/app.json` (pre-existing
  `ITSAppUsesNonExemptEncryption` change, not this lane's).
