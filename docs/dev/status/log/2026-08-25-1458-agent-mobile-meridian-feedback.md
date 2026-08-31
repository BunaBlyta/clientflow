### 2026-08-25 14:58 — mobile agent — apply Meridian visual feedback

Changed:
- Quieted notification and invoice status treatments, tightened invoice metrics, centered the project ring, and matched received/sent chat bubble colours and corners.
- Added Account Settings rows for Language, Theme, and Help & Support. Theme now switches the shared palette between light and dark; Help & Support opens a text-only screen.

Tried and abandoned:
- No additional approach was abandoned in this pass.

Left for next session:
- Validate the light/dark status bar appearance on a native device and test longer translated settings labels.

Assumptions made:
- Tapping Theme toggles between Light and Dark for the quick client-facing control requested here; persistence can be added later if needed.
- Help & Support is intentionally informational for now, with project notes remaining the actionable support channel.

Blockers:
- Browser preview was unavailable in this environment; Expo web export and TypeScript checks passed.
