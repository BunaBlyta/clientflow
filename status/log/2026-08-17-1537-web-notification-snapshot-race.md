### 2026-08-17 15:37 — web agent — notification snapshot race hardening

Changed:
- Changed the shared notification store's snapshot reconciliation to merge GET
  responses by ID instead of replacing the array.
- Newer Ably-only IDs now survive an older in-flight GET, while server records
  remain authoritative for IDs present in both collections.
- Added a regression test for event-first, stale-snapshot ordering.

Tried and abandoned (what didn't work, and why):
- None.

Left for next session:
- No additional web changes required for this hardening follow-up.

Assumptions made (flag if wrong):
- A snapshot that includes an ID is authoritative for that ID, including its
  read state.

Blockers:
- None for the web lane.

