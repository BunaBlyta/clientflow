### 2026-08-13 14:31 — Codex — mobile project detail previews and return navigation

Changed:
- Updated the project detail screen to call both `refreshNotes` and
  `refreshInvoices` when the project opens.
- Kept the store's project-scoped replacement behavior, which removes stale
  fixture records before adding live notes or invoices for that project.
- Fixed recent-note selection: the store sorts notes newest-first, so the
  homepage now previews the first two rather than the oldest two.
- Added up to two non-DRAFT `InvoiceRow` previews with their existing invoice
  detail navigation. Existing paid/outstanding totals and “View all” links
  remain in place.
- Added a visible “Back to projects” control using `router.navigate('/projects')`
  so returning selects the Projects tab and does not only pop a nested route.
- Smoke-tested the direct Expo web project-detail and project-invoices URLs;
  both returned HTTP 200 from the existing server on port 8081.

Tried and abandoned (what didn't work, and why):
- No new shared component or store API was introduced; the existing
  `InvoiceRow`, `NoteBubble`, refresh methods, and Expo Router routes already
  provided the required behavior.
- No native or simulator run was attempted.

Left for next session:
- The homepage still uses saved fixture previews while a live request is
  unavailable, and shows an inline warning when notes or invoices cannot be
  refreshed.

Assumptions made (flag if wrong):
- `notesForProject` remains newest-first as currently implemented, so
  `slice(0, 2)` is the correct recent-note preview.
- `router.navigate('/projects')` is the desired absolute tab destination;
  nested Notes, Invoices, Invoice Detail, and Checkout routes remain unchanged.

Blockers:
- No code blocker. The existing interactive browser surface was unavailable;
  Expo web was checked through HTTP and the generated bundle instead.
