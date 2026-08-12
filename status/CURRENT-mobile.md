# CURRENT — mobile lane (Agent C)

Last updated: 2026-08-12 by Codex — real onboarding verification and session flow

## Completed

- Added mobile API helpers for verification email send, non-destructive code
  verification, and password setup.
- `verify-code.tsx` no longer imports demo fixtures. It checks the entered email
  and code with the API, sends real resend requests, and passes the verified code
  through to set-password.
- `forgot-password.tsx` now requests a real reset code before opening the code
  screen.
- `set-password.tsx` submits `{ email, code, password }` to the API. On success
  it persists the returned session token and client session, then opens the
  projects screen directly for both invite and reset modes.
- Login and onboarding now share the same `startSession` path, which uses
  `writeSession` and updates the authenticated Zustand state.

## Verification

- `npx tsc --noEmit` from `mobile/`: passed.
- `git diff --check`: passed.
- No device or simulator testing was attempted; that test belongs to Buna
  because Expo Go cannot run this SDK and Xcode is not installed.

## Notes for the next session

- The mobile app still uses `http://localhost:3000` unless
  `EXPO_PUBLIC_API_URL` is set to a reachable web/API origin.
- The verification check is intentionally non-destructive. The code is carried
  into set-password, which is the only endpoint that consumes it.
- Notes and notification write controls remain disabled until their API routes
  land. Their read paths are live.
