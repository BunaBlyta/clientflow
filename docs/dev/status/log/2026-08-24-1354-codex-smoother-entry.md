# Smoother invoice and notification entry — 2026-08-24 13:54

## What changed

- Added configurable entry distance/fade to the shared `Screen` transition.
- Project and invoice detail screens opened from Invoices or Notifications now enter with a 24px slide and subtle fade, matching the existing 24px back exit.
- Normal tab switches and Projects-origin detail screens retain the smaller translate-only transition.
- This attempt is intentionally uncommitted per user request.

## Verification

- `npx tsc --noEmit` passed.
- `npx expo export --platform ios --output-dir /private/tmp/clientflow-mobile-ios-smoother-entry` passed.
