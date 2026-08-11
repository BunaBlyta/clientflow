# CURRENT — mobile lane

**Owner: the mobile agent. You are the only writer of this file. Overwrite it
before you stop. Do not edit the other CURRENT-*.md files.**

Last updated: 2026-08-11 by Claude (Cowork)

## State

- **Feature-complete on mock data.** Expo Router app covering the full client
  journey: login, invite-code verification, set password, forgot password, request
  status lookup, project list, project detail with stage tracker, notes feed,
  invoice list and detail, mock Stripe checkout, notifications with unread badge.
- **Requires Node 22** — run `nvm use 22` before any expo command. Expo SDK 57
  needs 22.13+ and the system default is older.
- **Never run on a simulator or device.** It was verified only via
  `npx tsc --noEmit` and `npx expo export --platform ios`. **Do this first** — it is
  the single most likely place for surprises to be hiding.
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

1. **Run it on a simulator and click through everything.** Before any new work.
2. Wire to the real API once endpoints exist — the plan is to swap the Zustand
   store's initial state and actions for `fetch` calls with the same shapes, so
   screens should barely change. Types in `mobile/lib/types.ts` were written to
   match what AGENTS.md §4 says the API will return.
3. Real Stripe, real push registration, real verification emails — all still mocked.

## Yours to touch

`mobile/` only. Nothing outside it.
