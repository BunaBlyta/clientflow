### 2026-08-28 16:42 — Codex — light-cyan request package modal

Changed:
- Replaced the light-theme “Request a package” modal’s flat white background with a subtle light-cyan radial and linear gradient using the existing brand colors.
- Left the dark-theme modal gradient unchanged.

Tried and abandoned (what didn't work, and why):
- None.

Left for next session:
- None.

Assumptions made (flag if wrong):
- “Request a package modal” refers to the public marketing modal in `components/marketing/packages-and-request.tsx`.

Blockers:
- `npm run verify` still stops at the two existing lint errors in `components/dashboard/date-picker.tsx` and `components/dashboard/settings-content.tsx`.
