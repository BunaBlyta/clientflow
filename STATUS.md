# STATUS.md

The shared memory between sessions and between agents. Every agent (Claude Code, Codex CLI) reads this before starting and appends to it before stopping. Newest entry on top. Don't delete old entries — this is the log of *why* things are the way they are, not just *what*.

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

### 2026-08-10 20:10 — Codex — retry initial Prisma migration
Changed:
- Confirmed that both `DATABASE_URL` and `DIRECT_URL` are now present in `.env`.

Tried and abandoned (what didn't work, and why):
- Retried `prisma migrate dev --name init_schema` using the pooled `DATABASE_URL`; Neon returned `P1001` because the database host could not be reached.
- Retried with `DIRECT_URL` temporarily substituted as the migration URL, without changing `.env`; the direct Neon host also returned `P1001` and could not be reached.

Left for next session:
- Retry the migration when the current environment can reach Neon on port 5432. No migration was created and the database was not changed.

Assumptions made:
- None.

Blockers:
- Network connectivity from this environment to both Neon database endpoints is currently unavailable.

---

## Template for each entry

```
### [YYYY-MM-DD HH:MM] — [agent: Claude Code / Codex] — [task name]
Changed:
- ...
Tried and abandoned (what didn't work, and why):
- ...
Left for next session:
- ...
Assumptions made (flag if wrong):
- ...
Blockers:
- ...
```

Write every entry in plain language a non-engineer could follow — see AGENTS.md section 7. "Tried and abandoned" matters as much as "Changed": if an approach got tried and dropped, say so and say why, so nobody re-tries the same dead end later, and so there's an honest record of the problem-solving that happened, not just the polished result.

---

### [example — delete once real entries exist]
### 2026-08-10 10:00 — Claude Code — initial scaffold
Changed:
- Set up repo structure, AGENTS.md, CLAUDE.md
Left for next session:
- Nothing built yet — waiting on SPEC.md to be filled in
Assumptions made:
- None yet
Blockers:
- None
