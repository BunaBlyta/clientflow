### 2026-08-28 09:57 — Codex — align mobile card and group spacing

Changed:
- Audited the requested Home and Invoices gaps and confirmed each already uses the same 12px spacing token for the named cards and rows.
- Reduced the Notifications date-group gap from 32px to 12px so successive headings and groups do not look disconnected.

Tried and abandoned (what didn't work, and why):
- No Home or Invoices code change was made because the requested gaps are already identical in source; changing them would not fix a mismatch.

Left for next session:
- Restart Metro with cache clearing if the Home or Invoices gaps still look unequal on the device, since their source values are already the same.

Assumptions made (flag if wrong):
- “These two with the main card” refers to the vertical gap from the main project card to the Next payment/Messages row.

Blockers:
- `npm run verify` stops during root lint on pre-existing web-owned errors in `components/dashboard/date-picker.tsx` and `components/dashboard/settings-content.tsx`.
- No physical device or simulator was available for visual verification.
