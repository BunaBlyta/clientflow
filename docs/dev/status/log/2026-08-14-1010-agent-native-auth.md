# Mobile lane — native iOS auth polish

Date: 2026-08-14
Agent: C

## Changed

- Moved the four auth detail screens onto the native Expo Router stack header.
  iPhone users now get the system chevron, native navigation transition, and
  edge-swipe back gesture.
- Added safe-area-aware bottom spacing to auth screens and safe-area top and
  bottom spacing to login.
- Simplified the invite path on login to a quiet inline link instead of an OR
  divider and stacked secondary button.
- Normalized remaining UI borders to `StyleSheet.hairlineWidth` and removed
  unused Android `elevation` values.

## Tried and abandoned

- No custom `ChevronLeft` was added. The native stack header supplies the
  platform-correct iOS chevron and its associated gesture behavior.

## Left

- No API or fixture behavior was changed.
- No physical iPhone or simulator screenshot was available for visual signoff.

## Assumptions

- Login should remain visually headerless because it is the auth entry screen;
  only subsequent auth screens need the native back affordance.

## Blockers

- None for the mobile implementation. The request-status screen remains
  fixture-backed because the documented API has no public status lookup route.
