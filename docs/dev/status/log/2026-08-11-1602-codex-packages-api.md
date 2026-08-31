### 2026-08-11 16:02 — Agent A — package API and project package summaries

Changed:
- Added public `GET /api/packages` for active packages, sorted by `sortOrder`.
- Converted package Decimal prices to JSON numbers and returned the requested package fields.
- Added a related package summary to both project GET responses while retaining the existing `packageId` field.
- Added route tests for package filtering/order/serialization and project response compatibility.
- Updated `docs/ARCHITECTURE.md` and `status/CURRENT-api.md` with the live response contract.

Tried and abandoned (what didn't work, and why):
- The first focused test run failed because the new GET test left a prior `findUnique` call in the mock history, making an existing client-refusal assertion fail. Added per-test mock clearing; the focused suite then passed.

Left for next session:
- The web lane can consume `/api/packages` for pricing and the nested project `package` object for detail views.

Assumptions made (flag if wrong):
- `GET /api/packages` is public because it feeds the public pricing page; it returns only active packages.
- `price` is serialized as a JSON number in major currency units, matching the existing Decimal-to-number conversion approach while preserving the requested `price` field name.

Blockers:
- `STATUS.md` and `docs/HANDOVER-2026-08-11.md` remain stale about route/write-endpoint counts; Buna owns those files and will update them.
