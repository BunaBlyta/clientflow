# 2026-08-28 — Claude Code — notifications: inline overflow, archive-marks-read, scroll reset

PM asked for three related notifications changes on mobile:

1. **Overflow beyond the capped preview.** Home's "Recent activity" card only ever showed the 3 newest notifications, with "See all" jumping to the full Notifications screen. PM wanted a way to see a bit more without a navigation/loading round trip. Landed on an inline "Show N more" expand (up to 8) using notifications already sitting in the store from the app-level refresh on login — no fetch, no screen change. The header's "See all" link is untouched; it still opens the full screen, which has archive/filter/infinite-scroll features the home card doesn't try to replicate.

2. **Archive should also mark read.** Previously deliberate: `archiveNotification` in `store/data-store.ts` explicitly preserved the existing read state on archive (there was a comment to that effect). PM reversed that call — archiving something now means you're done with it, so it should stop counting as unread too. The backend's `PATCH /api/notifications/:id` only toggles one of `archived` or `readAt` per call depending on whether the body has an `archived` key, so the client now fires both requests when archiving an unread notification. Unarchiving does not touch read state either way.

3. **Scroll position on return to the tab.** The Notifications screen should snap back to the top when the user switches back into that tab normally, but keep its scroll position if they opened a notification (which navigates to a project/invoice screen) and swiped back. Implemented with a ref flag set immediately before the navigate call in `handlePress`, checked once in the screen's `useFocusEffect`; `components/ui/Screen.tsx` now forwards a ref to the underlying `ScrollView` so the screen can call `scrollTo({ y: 0 })`.

Also discussed with the user, before implementation, why a search bar (PM's original suggestion for #1) was probably overkill for a short recency-ordered list, and settled on inline expand over a bottom-sheet/full-navigation alternative specifically to avoid the "load/blocking" feeling the PM flagged.

## Files touched

- `mobile/app/(app)/home.tsx`
- `mobile/app/(app)/notifications/index.tsx`
- `mobile/components/ui/Screen.tsx`
- `mobile/lib/i18n.ts` (new `ui.showMore` / `ui.showLess` keys, en/sq/de)
- `mobile/store/data-store.ts`

## Verification

- `npx tsc --noEmit` from `mobile/` passes.
- Not yet run on a device/simulator this session (none available) — the scroll-reset behavior in particular is worth a physical spot-check since it depends on tab-navigator focus/remount semantics that are hard to fully verify from source alone.
