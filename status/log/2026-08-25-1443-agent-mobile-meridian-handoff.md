### 2026-08-25 14:43 — mobile agent — match Meridian design handoff

Changed:
- Matched the mobile light theme to the Meridian handoff’s warm canvas, teal accent, white cards, sage activity rows, rounded geometry, and compact type scale.
- Updated Home, Projects, Invoices, Notifications, Account, and Project Detail presentation, including the three distinct project progress treatments.
- Kept navigation, API calls, stores, authentication, and payment behavior unchanged.

Tried and abandoned:
- Browser screenshot comparison was attempted, but no browser connection was available. The Expo web export completed successfully and the reference HTML was inspected directly.

Left for next session:
- Validate the visual pass on an iOS simulator or physical device, especially serif fallback rendering and long localized labels.

Assumptions made:
- The handoff’s light mode is the target for this pass; the existing app has no user-facing dark-mode switch.
- A system serif fallback is acceptable because adding Lora would require a dependency install, which the repo rules reserve for Buna.

Blockers:
- Mobile ESLint is not configured; `npx eslint .` reports all files are ignored.
