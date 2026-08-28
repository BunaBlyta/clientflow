### 2026-08-28 10:04 — Codex — refine archive icon position

Changed:
- Reduced the notification books/archive icon from 17px to 14px.
- Shifted its control 4px further toward the top of the notification row.
- Increased invisible hit slop so the smaller visual still has a 44px effective tap area.

Tried and abandoned (what didn't work, and why):
- Nothing.

Left for next session:
- Spot-check the refined position on a device.

Assumptions made (flag if wrong):
- “Further up” means a 4px upward visual adjustment without moving the notification content itself.

Blockers:
- `npm run verify` stops during root lint on pre-existing web-owned errors in `components/dashboard/date-picker.tsx` and `components/dashboard/settings-content.tsx`.
- No physical device or simulator was available for visual verification.
