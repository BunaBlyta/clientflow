# Mobile origin back buttons — 2026-08-24 13:20

## What changed

- Removed the `beforeRemove` listener from `mobile/components/OriginBackButton.tsx`.
- Changed the custom back action from `router.dismissTo(...)` to `router.replace(...)` so native project-stack detail screens reliably return to the Invoices or Notifications tab that opened them.
- Kept the normal native back button for detail screens without an origin tab.

## Verification

- `npx tsc --noEmit` passed.
- `npx expo export --platform ios --output-dir /private/tmp/clientflow-mobile-ios-back-fix` passed.
