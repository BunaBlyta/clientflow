# CURRENT — mobile lane (Agent C)

Last updated: 2026-08-11 by Codex — live invoice screens and Stripe checkout

## Completed

- Added authenticated mobile requests for invoice lists, invoice details, and Stripe checkout sessions.
- Invoice lists and details refresh from the API, show loading and unavailable-data messages, and keep fixture data visible when the API cannot be reached.
- Added the `CUSTOM` invoice kind label and kept invoice amounts in the API's `amountCents` format.
- Replaced the fake timed card flow with a real Stripe checkout URL opened in the system browser.
- Checkout checks the invoice again when the app resumes or when the user taps the manual status check. It only shows payment success after the API reports `PAID`.
- 409 already-paid and 503 Stripe-unavailable responses now show user-facing messages.
- Removed the obsolete local payment simulation from the data store.

## Verification

- `npx tsc --noEmit` from `mobile/`: passed under Node 22.23.2.
- `npx expo start --web --offline`: sandbox could not bind the web server; the same command outside the sandbox started Metro successfully and served `http://localhost:8081`.
- No AppleScript or system automation was used; the URL can be opened manually for click-through.

## Notes for the next session

- Set `EXPO_PUBLIC_API_URL` to a reachable web/API origin for a physical device; the default `http://localhost:3000` is only suitable for host/simulator testing.
- The handover note claiming mobile `Project.packageId` needs updating is stale. It is already `string | null`; no change was needed.
