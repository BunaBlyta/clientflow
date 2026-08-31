### 2026-08-17 16:08 — web agent — overview realtime activity surface

Changed:
- Added `request` entity support to the web realtime event validator and
  provider detail type.
- The overview page now refetches invoices, projects, and pending requests for
  invoice/project/request entity changes.
- Added a compact recent-notifications section to the overview, using the
  shared notification store so new realtime notifications appear on the
  dashboard as well as in the bell and full notifications page.
- Added focused request-event validation coverage.

Tried and abandoned (what didn't work, and why):
- No separate dashboard notification fetch was added. Reusing the dashboard
  provider's authoritative store avoids a second request and keeps the bell,
  activity section, and full page consistent.

Left for next session:
- Deploy and confirm a new request updates both the overview pending list and
  recent-notifications section without a browser refresh.

Assumptions made (flag if wrong):
- The overview's pending requests and recent notifications are the intended
  dashboard activity surface; invoice/project analytics already refetch on
  their entity events.

Blockers:
- None in the web code.

