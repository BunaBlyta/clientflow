# CURRENT — mobile lane (Agent C)

Last updated: 2026-08-13 11:18 by Codex — mobile Stripe return contract

## Completed

- Mobile note reads and posting are live through the notes API.
- Mobile notification reads, single mark-read, and mark-all read are live
  through the notification API.
- The account screen uses an inline logout confirmation instead of a native
  alert.
- The Stripe checkout request now sends `{ invoiceId, returnTo: "mobile" }`.
  This lets the API/payment page return the client to the mobile deep link.
- The existing checkout flow is unchanged: it opens Stripe's `checkoutUrl`,
  refreshes the invoice when the app returns through `AppState`, and only shows
  success after the API returns webhook-confirmed `PAID` status.
- Verified the intended destination remains
  `clientflow://projects/<projectId>/invoices/<invoiceId>/checkout`: the app
  still declares the `clientflow` scheme and the Expo Router route remains the
  existing checkout screen.

## Verification

- `npx tsc --noEmit` from `mobile/`: passed.
- Root `npm run test`: passed — 29 test files, 107 tests.
- Root `npm run typecheck`: passed.
- Root `npm run lint`: passed.
- `npx next build --webpack`: passed.
- `npm run verify`: typecheck, lint, and tests passed; the Turbopack build
  could not fetch Inter from Google Fonts in the sandbox.
- `git diff --check`: passed.
- No device or simulator testing was performed.

## Notes for the next session

- The mobile app still uses `http://localhost:3000` unless
  `EXPO_PUBLIC_API_URL` is set to a reachable web/API origin.
