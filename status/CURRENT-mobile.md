# CURRENT — mobile lane (Agent C)

Last updated: 2026-08-11 by Codex — SecureStore and project-list API wiring

## Completed

- Native sessions now use `expo-secure-store`; web sessions continue using `localStorage`.
- Login stores the real bearer token and client snapshot, restores it before routing, and clears both on logout.
- Project detail refreshes through authenticated `GET /api/projects/:id`.
- Project list refreshes through authenticated `GET /api/projects` and replaces fixtures with the API response.
- Fixture data remains visible when the API is unavailable locally.
- `npx tsc --noEmit` from `mobile/`: passed under Node 22.23.2.

## API seam still pending

- Notes, invoices, notifications, verification codes, and Stripe checkout remain on fixture data until their routes land.
- Set `EXPO_PUBLIC_API_URL` to the reachable web/API origin on a physical device; the default `http://localhost:3000` is only suitable for host/simulator testing.

## Verification

- Root `npm run verify`: typecheck and tests passed; lint has two existing warnings in another lane; Next build failed because the sandbox could not create a process/bind a port for Turbopack.
- Simulator/device click-through remains unavailable because this machine has no usable `simctl`/Xcode toolchain.
