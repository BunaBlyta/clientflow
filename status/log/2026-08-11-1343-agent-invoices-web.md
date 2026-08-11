# Web invoices — 2026-08-11

## Shipped

Converted `/dashboard/invoices` from the mock Zustand store to the shipped API.
The table loads invoices, projects, and clients together, maps their IDs to the
names shown in the table, and handles loading, failed requests, an empty database,
and filtered no-results separately. Amounts use the API's cents value directly.

Removed the local-only row actions and create button from this screen because
their Zustand mutations would look successful until refresh. Their write API is
not available yet, so a read-only live table is the honest behavior.

Added `CUSTOM` to the web invoice-kind union and the existing dialog label. The
mobile type was intentionally left alone because that file belongs to Agent C.

## Verification and follow-up

Typecheck, lint, and 9 tests passed. `npm run verify` still stops at the known
sandbox Turbopack process/port error; the webpack build passed all 23 routes.
The browser runtime reported no connected browser backends, so the requested
signed-in click-through could not be performed in this session. Buna should open
`http://localhost:3001/dashboard/invoices`, sign in with the staff account, and
check search, the Paid/Overdue filters, due dates, project links, and the absence
of non-persistent action menus.

The brief's old warnings about missing due dates and one seeded client were
ignored because the database was reseeded with the corrected demo data.
