### 2026-08-12 10:35 — API agent — package management endpoints

Changed:
- Added staff-only package creation and editing endpoints.
- Prices use the same major currency units as public package reads and are
  normalized to two decimal places.
- Package slugs are normalized and unique conflicts return a usable 409 error.
- Deactivation sets `isActive: false`; no package deletion route was added.
- Package updates only edit the package row, leaving existing project and invoice
  history unchanged.
- Added tests for creation, duplicate slugs, deactivation/price edits, and
  duplicate-slug updates; documented the contracts.

Tried and abandoned (what didn't work, and why):
- Next type generation initially rejected shared helper exports from the package
  route file. The helpers were moved into a private API helper module so route
  files export only HTTP handlers.

Left for next session:
- Run the full repository verification and commit/push endpoint 4 separately.
- Implement `GET /api/auth/me`, then assess the invitation resend wrapper.

Assumptions made (flag if wrong):
- Package slugs are URL-safe lowercase words separated by single hyphens; input
  is normalized to lowercase before uniqueness is checked.
- Editing a package's price must not update historical projects or invoices, so
  those tables are deliberately not queried or written.

Blockers:
- None for package management.
