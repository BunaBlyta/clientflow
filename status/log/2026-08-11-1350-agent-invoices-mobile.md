# Mobile invoices and Stripe checkout — 2026-08-11

## Changed

- Wired the project invoice list and invoice detail screens to Agent A's authenticated invoice endpoints, while preserving fixture data when the API is unreachable.
- Added loading, empty, and unavailable-data states.
- Added the `CUSTOM` invoice label.
- Replaced the fake timed payment simulation with a real request to `/api/stripe/checkout`, opening the returned Stripe URL with `expo-linking`.
- Refetched the invoice after returning from the browser and only displayed success when the API reported `PAID`.
- Added clear handling for already-paid (409), unavailable Stripe (503), failed, and unchanged payment states.
- Removed the old local `beginPayment`/`resolvePayment` simulation.

## Verification and abandoned attempts

- `npx tsc --noEmit` passed from `mobile/` under Node 22.23.2.
- `npx expo start --web` was attempted under Node 22. The sandbox could not bind the server, so it was stopped and retried with the approved outside-sandbox command. Expo then started Metro and served `http://localhost:8081`.
- A follow-up automated fetch of the page was abandoned after it hung; no AppleScript or `osascript` was used. Buna can open the printed URL manually.
- No package installation, Expo installation, migration, or worktree was performed.

## Stale handover note

The handover's `packageId` warning is stale. `mobile/lib/types.ts` already correctly declares `Project.packageId` as nullable, so it was left unchanged.
