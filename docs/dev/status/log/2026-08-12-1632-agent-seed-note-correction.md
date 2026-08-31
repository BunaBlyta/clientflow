# Seed note correction — 2026-08-12

Updated the demo seed text for `proj-3` so its congratulatory note addresses
Maya Patel, the Northstar Wellness client now assigned to that project,
instead of Jordan from the old Riverside assignment.

This changes seed text only; there is no schema or application-logic change.
After pulling the commit, Buna should run `npx prisma db seed` to update the
live development database. The seed uses upserts and does not wipe data.

Typecheck, lint, and all 73 tests passed. The normal build was blocked by the
local sandbox's known Turbopack port restriction; the Webpack build completed
successfully.
