# CURRENT — mobile lane (Agent C)

Last updated: 2026-08-13 11:09 by Codex — Stripe mobile return-link investigation

## Completed

- Mobile note reads and posting are live through the notes API.
- Mobile notification reads, single mark-read, and mark-all read are live
  through the notification API.
- The account screen uses an inline logout confirmation instead of a native
  alert.

## Payment return investigation

- Traced the mobile checkout screen, checkout helper, Stripe checkout route,
  Stripe success URL, web payment success page, and Expo Router entry points.
- The mobile checkout correctly opens the API's `checkoutUrl`, waits for the
  browser to return through `AppState`, refetches the invoice, and only shows
  success after the API reports `PAID`.
- The current contract cannot be fixed in `mobile/` alone. The API always sets
  `success_url` to the web payment page, and that page's “View invoices” link
  is hardcoded to `/dashboard/invoices`, so the mobile app never receives a
  `clientflow://` target to handle.
- No mobile source change was made. The exact required cross-lane contract is
  recorded in the task log: the mobile checkout needs an explicit mobile return
  mode, and the web success page must render a project/invoice deep link for
  that mode while keeping the existing staff-dashboard fallback for web users.

## Verification

- No mobile source code changed in this investigation.
- No device or simulator testing was performed; the app is still only verified
  under the existing web/typecheck workflow, and Expo Go cannot run this SDK.

## Notes for the next session

- After the API/payment-page contract is shipped, update the mobile checkout
  helper to request the mobile return mode and verify the deep link opens the
  existing checkout route. Keep the existing AppState invoice refresh and
  webhook-confirmed `PAID` check.
- The mobile app still uses `http://localhost:3000` unless
  `EXPO_PUBLIC_API_URL` is set to a reachable web/API origin.
