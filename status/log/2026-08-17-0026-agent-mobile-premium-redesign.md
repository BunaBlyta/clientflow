### 2026-08-17 00:26 — mobile agent — premium client redesign

Changed:
- Refined the mobile theme with warm light surfaces, restrained dark mode,
  exact landing cyan accents, and softer spacing/radius tokens.
- Added the requested five-tab presentation: Home, Projects, Invoices,
  Notifications, and Account.
- Added presentation-only Home and global Invoices views using the existing
  data store and existing navigation actions.
- Restyled project rows, project detail section headers, the progress tracker,
  invoice rows, notes, notifications, account sections, buttons, fields, and
  cyan backdrop treatment.
- Preserved all existing API calls, stores, routes, payment flow, note actions,
  notification actions, theme switching, language switching, and logout
  behavior.

Tried and abandoned:
- A live browser/device screenshot pass was attempted, but no browser or
  simulator connection was available in this environment. The Expo web export
  was used as the platform-level smoke check instead.

Left for next session:
- Review the new visual system on a physical iPhone or simulator, especially
  the five-tab bar, the compact stage labels, and long translated notification
  rows.

Assumptions made:
- Home is a presentation layer over the first existing project and its first
  payable invoice; it does not introduce a new data source or workflow.
- The global Invoices tab intentionally reuses existing invoice row and detail
  routes so behavior stays identical to the project-scoped invoice list.

Blockers:
- No connected device/browser was available for visual QA.
