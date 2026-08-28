# 2026-08-28 — Claude Code — Account/Home polish batch (logout modal, icons, project switcher, transitions)

PM asked to hold off committing mid-session ("don't commit for now") while iterating on several Account/Home tweaks live against a device. This entry covers everything from that point through the "commit" go-ahead.

## Logout: inline swap → real modal

PM: "maybe logout should open a modal instead." Replaced the inline Cancel/Log out button swap with an actual `Modal` — dimmed backdrop (tap to dismiss), centered card, `onRequestClose` wired for the hardware back button. Follow-ups from watching it live:
- "grey the button out when the modal opens" — the trigger button gets `disabled` + an `opacity: 0.45` style while the modal is up.
- "buttons on modal too much height" — 56px → 44px (still clears the 44pt minimum touch target), border radius scaled down to match (`radius.lg` → `radius.md`).
- "yes, log me out shuld be the label" → "Yes, log me out" — added a distinct `account.logMeOut` key so the modal's confirm button reads differently from the "Log out" trigger button that opened it.

## Settings row icons: final state

Multi-step follow-up to the icon-color change from earlier today:
1. Icons grey → green (`color.accent`) — already committed earlier.
2. Box behind them grey → `accentSoft` → a lighter alpha wash (`${color.accent}1F`) → **removed entirely** ("maybe we can lose the bg entirely").
3. "make sure icons and text are inline" — the wrapper wasn't resized after the background was dropped, so it still had the old 32x32 box's implicit padding around the 16px icon, reading as disconnected from its label. Shrunk the wrapper to 16x16.
4. "think text should be aligned with bottom of icon" → "make them same size so top and bottom are both aligned" — the label's line-height didn't match the icon's box height, so `alignItems: flex-end` only lined up one edge. Set both to exactly 20px (`settingsIcon` height, label `lineHeight`) inside a new `settingsLeading` wrapper, `alignItems: center` — now top and bottom both align since the two boxes are the same size.

## Home: pick which project shows

PM: "should have option to pick what project we want displayed on the homepage." Asked two clarifying questions first (interaction style, persistence) — answers: cycle with arrows, per-device only.

First attempt: a standalone row above the project card with prev/next arrows and an "N of M" counter. PM: "dont like it, shouldnt change structure of how page was and not take up too much visual space." Rebuilt inside the *existing* status-header row instead — two small (16px) chevrons flanking the status pill, only rendered when `projects.length > 1`. Since they sit inside the card's own tap-to-open-details `Pressable`, their `onPress` calls `event.stopPropagation()` before cycling.

Persistence: new `mobile/lib/home-project-preference.ts`, mirroring the existing `expo-secure-store`/`localStorage` pattern already duplicated in `lib/i18n.ts` (language) and `lib/theme.ts` (theme mode) rather than introducing a new shared abstraction — matches this codebase's existing convention of one small self-contained module per preference. Per-device only, not synced to the account (would need a new API field — out of scope for this lane).

## Home: "No new messages"

PM: "even if theres nothing new there is a description [...] put something like no new msgs." The Messages stat card's subtext showed `notifications[0]`'s title regardless of read state — so "0 new" could still be paired with e.g. "Payment failed" from days ago. Now checks `unreadMessages > 0` before showing a notification title; otherwise shows the new `ui.noNewMessages` key.

## Tab transition smoothing

PM: "make transitions of tab to tab smoother." The existing `sceneStyleInterpolator` only animated `translateX` — no opacity blending, which reads as an abrupt cut rather than a smooth handoff once scenes overlap mid-transition. Added an opacity fade (0→1→0 across the transition), shortened the slide distance (24px→16px), and lengthened the duration (180ms→220ms, within the design direction's 200-250ms entrance range). Left the easing (`Easing.out(Easing.cubic)`) unchanged since it already matched spec.

## Files touched

- `mobile/app/(app)/account/index.tsx`
- `mobile/app/(app)/home.tsx`
- `mobile/app/(app)/_layout.tsx`
- `mobile/lib/i18n.ts`
- `mobile/lib/home-project-preference.ts` (new)

## Verification

- `npx tsc --noEmit` from `mobile/` passes throughout.
- All of this was iterated live against the PM's own device this session (unlike some earlier work today), so it's been visually confirmed as it went — this is the first batch this session where I'm reasonably confident going in, rather than flagging "not checked on a device" at the end.
