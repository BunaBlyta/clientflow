### 2026-08-31 14:03 — Codex — diagnose stale mobile bundle crash

Changed:
- Confirmed `mobile/app/(app)/account/index.tsx` currently renders `Globe2` at the reported line and contains no `KeyRound` usage.
- Confirmed `KeyRound` is still used and imported in the dedicated change-password screen and edit-profile screen.
- Recorded that the Expo error overlay's `_layout.tsx` line is the navigation call-stack location, not a second failing `animation` property.

Tried and abandoned (what didn't work, and why):
- No source-code import patch was made because the current account screen has no missing `KeyRound` reference to fix; adding an unused import would not address the stale bundle.

Left for next session:
- Restart Expo from `mobile/` with `npx expo start -c` so Metro rebuilds the current source.

Assumptions made (flag if wrong):
- The reported stack came from a previously cached bundle, because its line contents do not match the current checked-out source.

Blockers:
- None.
