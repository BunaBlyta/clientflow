# Mobile tab switch motion — 2026-08-24 13:37

## What changed

- Added an opt-in tab transition to the shared `Screen` component: focused tab content fades from 86% to full opacity while sliding 12px into place over 180ms.
- Enabled it for Home, Projects, Invoices, Notifications, and Account.
- Kept the native tab navigator animation disabled so tab switches do not reintroduce the intermittent blank Notifications scene or the dark-mode white flash.

## Verification

- `npx tsc --noEmit` passed.
- `npx expo export --platform ios --output-dir /private/tmp/clientflow-mobile-ios-tabs-motion` passed.
- `npx expo export --platform web --output-dir /private/tmp/clientflow-mobile-web-tabs-motion` passed.
