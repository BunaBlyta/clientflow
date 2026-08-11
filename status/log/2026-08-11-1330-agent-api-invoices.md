### 2026-08-11 13:30 — Agent A — invoice endpoints and seed data

Changed:
- Added staff/client-scoped invoice list and detail endpoints.
- Converted database invoice amounts from dollars to integer cents for both frontend apps.
- Added safe fallback labels, optional ISO dates, `CUSTOM` invoice support, and tests.
- Added due dates to every seeded invoice, including two past-due `SENT` rows.
- Added Northstar Wellness and Atelier Forma client accounts and moved projects 3–4 plus their invoices to them. Riverside still owns projects 1–2.
- Documented the invoice response contract in `docs/ARCHITECTURE.md`.

Tried and abandoned (what didn't work, and why):
- The first focused test imported the route directly, which loaded Prisma and failed without `DATABASE_URL` even though the test only needed response mapping. Moved the serializer into a side-effect-free helper instead.
- The required Turbopack build still fails in this sandbox when it tries to create a process and bind a port. The webpack fallback build passed, so this is environmental rather than an application compile error.

Left for next session:
- Web and mobile agents need to widen their invoice kind unions to include `CUSTOM` and wire their invoice screens to these endpoints.

Assumptions made (flag if wrong):
- Added a twelfth invoice to preserve the existing DRAFT, VOIDED, FAILED, and PAYMENT_PENDING examples while providing a second past-due SENT row.
- Used Northstar Wellness and Atelier Forma as the two new demo clients and set their passwords in the lane handoff.

Blockers:
- None in the API lane. Do not run Prisma migrations or package installs concurrently; neither was needed here.
