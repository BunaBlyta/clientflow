# 2026-08-28 — Claude Code — notifications tab: manual "Load older" instead of scroll-triggered pagination

Follow-up correction to the earlier session today (`2026-08-28-1500-claude-notifications-overflow-archive-scroll.md`): that entry built the maxNotifs/overflow idea into Home's "Recent activity" preview, but the PM's original ask was about the actual Notifications tab screen. Home was already fine and its change was reverted (`git revert`-equivalent commit, see `mobile/app/(app)/home.tsx`).

On the real Notifications tab, the list already fetched everything eventually via scroll-triggered infinite pagination (a scroll listener called `loadMoreNotifications` once the user neared the bottom, showing a spinner). The PM wants the total capped but older notifications still reachable, without that automatic "load while scrolling" feel. Landed on: keep the same 20-per-page pagination (`NOTIFICATION_PAGE_SIZE`) and `notificationsHasMore`/`loadMoreNotifications` store plumbing, but replace the scroll listener with an explicit "Load older" button shown at the bottom whenever more pages exist. The network call still happens, but only when the user asks for it — no more spinner appearing mid-scroll.

Also removed the two now-unused `ui.showMore`/`ui.showLess` i18n keys added for the reverted Home change, and added `notifications.loadOlder` (en/sq/de) for the new button.

## Files touched

- `mobile/app/(app)/notifications/index.tsx` — removed `handleScroll`/`onScroll` wiring, added `handleLoadOlder` + a "Load older" `Pressable` rendered when `notificationsHasMore` and not already loading.
- `mobile/lib/i18n.ts` — removed unused `ui.showMore`/`ui.showLess`, added `notifications.loadOlder`.
- `mobile/app/(app)/home.tsx` — reverted to its state before the earlier misscoped change.

## Verification

- `npx tsc --noEmit` from `mobile/` passes.
- Not run on a device this session (none available).
