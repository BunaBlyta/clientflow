# CURRENT — mobile lane (Agent C)

Last updated: 2026-08-11 by Codex — real auth/session wiring

## Completed

- Replaced the demo-only login check with `POST /api/auth/login`.
- Keeps the returned bearer token in the auth store and sends it on the real project-detail request, `GET /api/projects/:id`.
- Restores the saved session before the router chooses the auth or app stack, and clears it on logout.
- Refreshes project detail data from the API while keeping the existing fixture visible if the local API is unavailable.
- Mobile TypeScript check passes.

## Storage note / blocker

The mobile project does not currently include a native persistence package. The
new adapter persists in web `localStorage`, but native app restarts still need
SecureStore. Buna must run this exact command (I did not run it):

`cd mobile && npx expo install expo-secure-store`

After that dependency is installed, replace the native fallback in
`mobile/lib/token-storage.ts` with SecureStore calls before shipping to a
device. Never put the session token in plain native storage.

## API seam still pending

- The API currently exposes login and single-project detail only. The mobile
  project list, notes, invoices, notifications, verification codes, and Stripe
  checkout remain on fixture data until their routes land.
- Set `EXPO_PUBLIC_API_URL` to the reachable web/API origin when running on a
  physical device; the default `http://localhost:3000` only works on the host
  machine or a simulator.

## Verification / run attempt

- `npx tsc --noEmit` from `mobile/`: passed under Node 22.23.2.
- Root `npm run verify`: typecheck, tests, and lint completed; Next build failed
  because the sandbox could not create a process/bind a port for Turbopack.
- iOS launch was attempted before code changes, but this machine has no usable
  `simctl`/Xcode simulator toolchain. Expo web also could not be reached, and
  no in-app browser was available, so no UI click-through was possible here.
