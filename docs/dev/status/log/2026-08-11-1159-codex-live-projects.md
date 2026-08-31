### 2026-08-11 11:59 — Codex — convert projects list to live API

Changed:
- Converted the Projects tab at `/dashboard/projects` from the mock project array to `GET /api/projects`.
- Loaded the live client list from `GET /api/clients` so the table can resolve each project's `clientId` to a company name.
- Added loading, API error with retry, empty database, and filtered-no-results states.
- Changed the web `Project.packageId` type to `string | null`; null packages display as “Custom project”. Known package IDs are formatted without depending on mock package data.
- Removed the mock status dropdown from live project rows. Status is shown read-only until the API exposes a status-update route.

Tried and abandoned (what didn't work, and why):
- Keeping the existing mock `ProjectStatusMenu` would update a separate Zustand mock store and make the live row appear inconsistent, so it was removed from this live table.

Left for next session:
- Stop for Buna's review as requested. The Requests tab on this route remains on mock data and should be handled as a separate screen conversion.

Assumptions made (flag if wrong):
- The live API intentionally returns package IDs rather than package names, so the UI formats the ID and uses “Custom project” for null.
- A projects-list API error is shown if either projects or the supporting client lookup fails, rather than showing an incomplete table.

Blockers:
- `npm run verify` remains non-green only because Next 16 Turbopack cannot create its CSS worker in this environment. Typecheck, lint, tests, and the webpack production build pass.
- `lib/types.ts` now reflects the nullable database field; the mobile type is intentionally untouched because Agent C owns `mobile/**`.
