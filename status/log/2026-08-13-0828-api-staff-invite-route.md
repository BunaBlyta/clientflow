### 2026-08-13 08:28 — Codex — fix staff invite route mapping

Changed:
- Added `app/api/staff/invite/route.ts` as the sole handler for
  `POST /api/staff/invite`.
- Removed the invite POST from `app/api/staff/route.ts`, leaving its staff list
  GET intact.
- Moved shared invite logic and staff response helpers into API-owned helper
  files.
- Moved route tests to the real invite route directory and added a filesystem
  route-mount check.

Tried and abandoned (what didn't work, and why):
- The first combined patch did not apply because the existing email-validation
  regex differed from the patch context. No files were changed by that failed
  attempt; the split route was then applied in smaller, verified patches.

Left for next session:
- Nothing pending in the API lane for this routing fix.

Assumptions made (flag if wrong):
- `/api/staff` should remain list-only. The documented invite endpoint is the
  only staff-invite write route.
- The existing response shapes and invite/email behavior remain unchanged.

Blockers:
- None.
