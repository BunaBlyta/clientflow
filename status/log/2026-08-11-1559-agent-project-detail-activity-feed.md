### 2026-08-11 15:59 — web agent — project detail activity feed

Changed:
- Replaced the detail page's mock project/client reads with `GET /api/projects/:id`
  and `GET /api/clients`.
- Replaced the Zustand notes selector with `GET /api/notes?projectId=…`, using the
  API's `body` field and a no-cache request.
- Added loading and error states with retry behavior matching the projects and
  invoices screens.
- After the status PATCH returns, the page performs a fresh server notes request;
  it does not append or predict the system note locally.
- Disabled the note composer and added a short explanation that posting is not wired
  up yet.
- Left the package lookup behind a TODO because the current API exposes only the
  package ID; the separate package API work will replace it in a follow-up pass.

Tried and abandoned (what didn't work, and why):
- Tried to use the in-app browser for the required signed-in click-through. The
  browser runtime had no available backends, so no browser result was claimed.
- The normal Turbopack build hit the known sandbox port restriction; the webpack
  fallback passed.

Left for next session:
- Once package data lands, replace the TODO mock lookup with the package API.
- Re-run the staff browser flow at narrow and wide widths when a browser backend is
  available.

Assumptions made (flag if wrong):
- The live project detail endpoint is the right source for the project record while
  invoices remain on their existing detail-page path.

Blockers:
- Browser runtime unavailable in this environment; browser verification remains
  pending.
