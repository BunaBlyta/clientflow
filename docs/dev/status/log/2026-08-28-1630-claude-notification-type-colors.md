# 2026-08-28 — Claude Code — notification icon colors by type

PM asked for a different icon color per notification type. The user (correctly) flagged that the app doesn't have many theme colors to draw from — per the design direction in AGENTS.md, color is deliberately restrained to one UI accent (`#5AB2FF`-equivalent per-theme) plus standard semantic status colors, kept separate from decorative use. Literally giving each of the 9 `Notification['type']` values its own hue would mean inventing roughly 6 new colors outside that palette.

Instead, extended the existing 4 semantic colors (accent/success/warning/danger — already defined in `lib/theme.ts` and used elsewhere for status badges) to cover all 9 types, grouped by what the color means rather than a 1:1 per-type mapping:

- **accent** (informational, resting state): `REQUEST_SUBMITTED`, `PROJECT_STAGE_CHANGED`, `NEW_NOTE`
- **warning** (wants the client's attention — an amount to review/pay): `INVOICE_ISSUED`, `EXTRA_CHARGE_CREATED`
- **success** (positive outcome): `REQUEST_APPROVED`, `PAYMENT_SUCCEEDED`
- **danger** (negative outcome): `REQUEST_REJECTED`, `PAYMENT_FAILED`

Replaced `NotificationRow.tsx`'s old `typeColor()` (which only split success/danger/default, i.e. accent for everything else) plus its separate `isDanger`/`isSuccess`/`iconBackground` booleans with a single `notificationTone()` returning both the icon tint and its background tint together. This is combined with the already-distinct Lucide icon per type (unchanged) for the actual differentiation the PM wants, while staying inside the existing palette.

## Files touched

- `mobile/components/NotificationRow.tsx`

## Verification

- `npx tsc --noEmit` from `mobile/` passes.
- Not checked visually on a device/simulator this session.
