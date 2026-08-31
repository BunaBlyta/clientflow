# 2026-08-28 — Claude Code — fix stale `notificationsHasMore` sticking the "Load older" button

PM reported the new "Load older" button (added earlier today, see `2026-08-28-1530-claude-notifications-load-older.md`) staying visible even when there was nothing left to load.

Root cause: `refreshNotifications` in `mobile/store/data-store.ts` computed `notificationsHasMore` as `state.notificationsHasMore || page.hasMore` whenever the refresh wasn't an explicit reset (i.e. any background/realtime refresh while already hydrated, via `notification-coordinator.tsx` or the app-layout mount effect). Once `notificationsHasMore` became `true`, that OR meant no later non-reset refresh could ever flip it back to `false` — only the notifications screen's own focus-triggered `reset: true` refresh bypassed the OR and reflected the server's live value. Any background refresh in between could leave a stale `true` visible on screen until the user happened to re-focus the tab.

Fix: always assign `notificationsHasMore: page.hasMore` directly, dropping the OR. The just-fetched page-1 response is always the freshest signal for "is there more beyond what's loaded," so there's no need to latch a past `true`.

## Files touched

- `mobile/store/data-store.ts`

## Verification

- `npx tsc --noEmit` from `mobile/` passes.
- Not verified on a device against a live backend (none reachable this session, per the "Login reachability finding" section of `status/CURRENT-mobile.md`) — worth a real check once the API is reachable again, specifically: load a small notification set (< 1 page), background-refresh (e.g. trigger a push), and confirm the button stays hidden.
