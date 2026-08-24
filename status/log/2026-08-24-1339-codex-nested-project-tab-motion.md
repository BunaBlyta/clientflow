# Nested project tab motion — 2026-08-24 13:39

## What changed

- Enabled the existing 180ms focus fade/slide on project detail, Notes, project invoice list, and invoice detail screens.
- Returning to the Projects tab now animates the preserved selected project route instead of only animating the Projects list screen.
- Origin back animation styles are now omitted when no source tab exists, allowing the nested tab transition to run normally for projects opened from Projects.

## Verification

- `npx tsc --noEmit` passed.
- `npx expo export --platform ios --output-dir /private/tmp/clientflow-mobile-ios-nested-tabs-motion` passed.
