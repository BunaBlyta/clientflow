# CURRENT — mobile lane (Agent C)

**You own `mobile/**` only — nothing outside it. You are the only writer of this
file. Overwrite it before you stop. Never edit another lane's CURRENT-*.md.**

Last updated: 2026-08-11 by Claude (Cowork) — lane setup

Your lane is the safest of the three: `mobile/` is a separate project with its own
`package.json` and its own types, so you physically cannot collide with the other
agents. Stay inside it.

## Hard rule: you do not run installs

**Never run `npm install` or `npx expo install` yourself.** Print the command and
stop — Buna runs it. Also: everything here needs **Node 22** (`nvm use 22`); Expo
SDK 57 requires 22.13+ and the system default is older.

## What exists

- **Feature-complete on mock data.** Login, invite-code verification, set
  password, forgot password, request-status lookup, project list, project detail
  with stage tracker, notes feed, invoice list and detail, fake checkout,
  notifications with unread badge.
- Plain StyleSheet plus `lib/theme.ts`, not NativeWind. Zustand stores in `store/`.
- Runs in a browser (`npx expo start --web`). **Never run on a simulator or a real
  device** — that remains the largest untested area.
- Two bugs were fixed yesterday, both found only by running it: a missing root
  route (`app/index.tsx`, now redirects based on auth state) and five Zustand
  selectors that rebuilt arrays every render and caused infinite re-render loops
  (all now wrapped in `useShallow`).
- Demo data: `jordan@riversidecoffee.com` / `riverside123`, code `123456`
  (`000000` triggers the expired-code state).

## The honest state of auth here

The verification flow is **screens only**. `app/(auth)/verify-code.tsx` compares
the typed code against the constant `DEMO_VALID_CODE` in `lib/mock-data.ts`. No
email is ever sent. There is no network call anywhere in the mobile app. The
"resend code" button runs a cooldown timer and nothing else.

Session does not persist across an app restart — no token storage.

## Your job, in dependency order

1. **Wire to real endpoints as the API lane ships them.** The plan: swap the
   Zustand store's initial state and actions for `fetch` calls with the same
   shapes, so screens barely change. Login already exists — `POST /api/auth/login`
   returns a token; send it as `Authorization: Bearer <token>`. Store it so login
   survives a restart.
2. **Real verification codes** once the API lane's send/check endpoints exist.
3. **Real checkout** once the Stripe webhook is real. Keep the current screen's
   shape — it already models the right behaviour (pay → PAYMENT_PENDING → confirmed
   → PAID), it just fakes the confirmation.
4. **Run it on a simulator or device.** Nobody has, once.

## Flagged assumptions — correct if wrong

- Request-status is reachable from the login screen, since a prospect with a
  pending request has no password yet. SPEC.md does not specify this navigation.
- Draft invoices are hidden from clients entirely. If the backend intends clients
  to see them, remove the filter in `app/(app)/projects/[id]/invoices/index.tsx`.

## Yours to touch

`mobile/**` and this file. Nothing else, ever.
