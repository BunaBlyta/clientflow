# 2026-08-27 16:00 — Claude Code — serif currency figures dipping below baseline

## Question from PM review

"The number after the comma in the second KPI card sits a bit below."

## Answer / cause

Not a layout bug. Currency amounts use `fontFamily.serif`, which is
`Georgia`. Georgia ships with **oldstyle (text) figures** as its default
numerals: 0/1/2 sit at x-height, 6/8 rise above, and 3/4/5/7/9 descend
below the baseline. So "$24,500.00" visibly steps up and down. It only
looked wrong on one card because the other amount's digits happened not to
include descenders.

## Fix

`fontVariant: ['lining-nums', 'tabular-nums']` on:
- `app/(app)/invoices/index.tsx` → `summaryValue`
- `components/InvoiceRow.tsx` → `amount`

lining-nums = all digits on one baseline at cap height; tabular-nums = even
digit/comma widths so amounts align as a column. iOS honours both for
Georgia via CoreText; Android's serif fallback already uses lining figures.

Other serif currency spots (project overview screen) can get the same
treatment if the same thing is noticed there.

`npx tsc --noEmit` passes from `mobile/`. Not verified on-device.
