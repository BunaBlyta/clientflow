### 2026-08-10 20:00 — Codex — Prisma data model
Changed:
- Defined the database tables for users, clients, service packages, project requests, contact leads, projects, invoices, shared project notes, and notifications in `prisma/schema.prisma`.
- Added the status choices needed by the brief: pending/approved/rejected requests; all project stages including cancelled and on hold; and the complete invoice lifecycle from draft through paid, failed, voided, and refunded.
- Added relationships and indexes so clients can have multiple projects, projects can have multiple invoices and notes, and notifications belong to individual users.
- Added the authentication and Stripe fields needed by the planned flows, including verification/reset/invitation token storage, email verification dates, invoice due dates, and Stripe checkout/payment identifiers.
- Updated `prisma.config.ts` to read both `DATABASE_URL` and Neon’s direct migration connection from `DIRECT_URL`.
- Prisma schema validation passed.

Tried and abandoned (what didn't work, and why):
- Tried to put `url` and `directUrl` directly in the schema datasource as requested. This project uses Prisma 7.9.1, which rejects both fields in `schema.prisma`; Prisma 7 requires them in `prisma.config.ts`, so the working equivalent is there instead.

Left for next session:
- Run the initial migration once the Neon connection variables are available in the shell or a local environment file, then generate the Prisma client.

Assumptions made (flag if wrong):
- Added conventional fields that the feature brief requires but does not name individually: client company/phone details, package slug/price/currency/ordering, project dates, invoice type and payment timestamps, and auth token hashes/expiry dates.
- `ProjectRequest.clientId` is optional so rejected requests never create a client, while an approved request can be linked to the created client.
- `Project.packageId` is optional to support custom projects without a standard package.
- Notes use an optional author so system-generated audit entries can exist without impersonating a user; notes remain immutable by omitting update/delete metadata and API behavior will enforce that later.

Blockers:
- No `DATABASE_URL` or `DIRECT_URL` is present in the current environment, so `prisma migrate dev --name init_schema` could not run and no migration was created. The command stopped before changing the database.

---
