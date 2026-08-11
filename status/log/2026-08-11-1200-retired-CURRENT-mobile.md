# CURRENT — mobile lane

**Owner: the mobile agent. You are the only writer of this file. Overwrite it
before you stop. Do not edit the other CURRENT-*.md files.**

Last updated: 2026-08-11 by Claude (Cowork), fix 2

## State

- **Feature-complete on mock data.** Expo Router app covering the full client
  journey: login, invite-code verification, set password, forgot password, request
  status lookup, project list, project detail with stage tracker, notes feed,
  invoice list and detail, mock Stripe checkout, notifications with unread badge.
- **Requires Node 22** — run `nvm use 22` before any expo command. Expo SDK 57
  needs 22.13+ and the system default is older.
- **Now verified in a browser, not just a simulator/device.** The app was run with
  Expo's web target, which is what surfaced two real bugs (both now fixed, see
  below) — a simulator alone never would have caught them, since they only show up
  under React's stricter web rendering checks:
  1. **Infinite re-render loop, fixed (took two passes).** Several screens read
     lists (a client's projects, a project's invoices, a project's notes, and — in
     a fifth spot found on the second pass — the sorted notifications list) out of
     the shared data store using a selector that built a brand-new array every
     time it ran. Zustand treats a new array as "the data changed" even when the
     actual contents are identical, so the app got stuck re-rendering those
     screens forever ("Maximum update depth exceeded" / "The result of
     getSnapshot should be cached" error). Fixed by wrapping those five selectors
     in Zustand's `useShallow` helper, which compares the array's contents instead
     of its identity — the screens now re-render only when the underlying data
     actually changes. Touched: `app/(app)/projects/index.tsx`,
     `app/(app)/projects/[id]/index.tsx`, `app/(app)/projects/[id]/invoices/index.tsx`,
     `app/(app)/projects/[id]/notes.tsx`, `app/(app)/notifications.tsx`.
     Note: the first pass missed `notifications.tsx` (its selector did
     `[...s.notifications].sort(...)`, a spread-then-sort, which builds a new array
     just like the `.filter()` cases already fixed). The error React reported
     pointed at `app/(app)/_layout.tsx` line 8/11 (`<Tabs>`), which is just the
     nearest navigator to the loop — the actual bug was one level down, in the
     notifications screen's own selector.
  2. **Missing home route, fixed.** There was no screen registered for the app's
     root path ("/"), because both top-level route groups are named in a way that
     hides them from the URL. On a phone this was invisible — the app just opens
     to its first screen regardless. In a browser (or via a deep link) it showed
     an "Unmatched Route" error instead. Added `app/index.tsx`, which redirects to
     the projects list if logged in or the login screen if not.
  - Also added the `react-dom` and `react-native-web` packages, required for the
    Expo web target to run at all.
- Plain StyleSheet plus `lib/theme.ts`, not NativeWind. Zustand stores in `store/`.
- Auth does not persist across app restart (no token storage) — deliberate, there
  is no real session yet.
- Demo credentials live in `mobile/lib/mock-data.ts`: `jordan@riversidecoffee.com`
  / `riverside123`, code `123456`. Code `000000` triggers the expired-code state.
- No tests.

## Flagged assumptions — correct these if wrong

- Request status is a screen reachable from login (a prospect has no password yet).
  SPEC.md does not specify this navigation; it was a best guess.
- Draft invoices are hidden from clients entirely. If the backend intends clients to
  see them, remove the filter in `app/(app)/projects/[id]/invoices/index.tsx`.

## Next, in order

1. **Click through the app in the browser (and ideally a simulator too) end to
   end** to confirm nothing else was hiding behind the two bugs above.
2. Wire to the real API once endpoints exist — the plan is to swap the Zustand
   store's initial state and actions for `fetch` calls with the same shapes, so
   screens should barely change. Types in `mobile/lib/types.ts` were written to
   match what AGENTS.md §4 says the API will return.
3. Real Stripe, real push registration, real verification emails — all still mocked.

## Yours to touch

`mobile/` only. Nothing outside it.
