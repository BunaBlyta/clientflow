# Project detail live-data audit — 2026-08-11 15:53

Inspected the requested API contracts and the staff project detail dependencies before editing.

- `GET /api/projects` and `GET /api/projects/:id` return `packageId` but not package name, price, or custom-pricing information.
- `GET /api/clients` returns client contact fields but no package information.
- There is no `app/api/packages/` route to provide the missing package details.
- The detail page currently gets those fields from `getPackage`, so converting it as requested would require an API change or an unapproved UI behavior change.

Stopped before editing code. The note composer disablement, server refetch after status changes, verification, browser click-through, commit, and push remain undone until the package-data contract is resolved.
