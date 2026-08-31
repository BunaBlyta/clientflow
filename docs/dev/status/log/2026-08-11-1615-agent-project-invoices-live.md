### 2026-08-11 16:15 — web agent — project invoices live data

Changed:
- Replaced the project-detail page's Zustand invoice selector with
  `GET /api/invoices?projectId=…`.
- Added invoice loading to the page's existing API load and error handling.
- Kept invoice rows newest-first, matching the main invoices dashboard's server
  serializer and ordering.
- After Send or Void succeeds, the page replaces the matching row with the exact
  invoice record returned by the server; it no longer writes to the mock store.

Tried and abandoned (what didn't work, and why):
- Tried to complete the requested browser comparison and row-action click-through.
  The browser runtime had zero available backends, so no signed-in UI result was
  claimed.
- The normal Turbopack build hit the documented sandbox port restriction; the
  webpack fallback passed.

Left for next session:
- Run the browser comparison against `/dashboard/invoices` for the same project when
  a browser backend is available.

Assumptions made (flag if wrong):
- The existing `InvoiceRowActions` callback contract is the intended handoff for the
  API-returned invoice object, as used by the main invoices dashboard.

Blockers:
- Browser runtime unavailable in this environment; visual and click-through
  verification remains pending.
