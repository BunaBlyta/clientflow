# 2026-08-27 15:45 — Claude Code — invoices KPI amount vertical alignment

Follow-up to the 15:30 padding fix. The amounts in the two KPI cards were
still not aligned vertically.

## Cause

The label "PAID TO DATE" wraps to two lines in the narrow half-width card,
while "OUTSTANDING" is one word and stays on one line. The amount sits
`marginTop` below the label, so a two-line label pushed the "Paid to date"
amount one line lower than the "Outstanding" amount.

## Fix

`numberOfLines={1}` on both labels in `app/(app)/invoices/index.tsx`.
Caption-size text, fits the card width in en/de/sq.

`npx tsc --noEmit` passes from `mobile/`. Not verified on-device.
