### 2026-08-12 09:20 — API agent — Flow A approval repair

Changed:
- Approval now creates a project named from the company or prospect and package,
  starting in `PENDING`.
- Approval now creates one deposit invoice for half the package price, in the
  package currency, with status `SENT` and an issue date.
- Both records are created inside the existing approval transaction, so a
  partial approval cannot leave behind only a client account.
- Added tests for the exact project and invoice payloads and for re-approval not
  creating duplicates.
- Documented the approval side effects and verification contract in the
  architecture handoff.

Tried and abandoned (what didn't work, and why):
- No code approach was abandoned. The normal build again hit the sandbox's
  Turbopack port restriction; the prescribed webpack build passed.

Left for next session:
- Buna should click through a fresh approval against Neon and read the resulting
  project and invoice through the client API.
- Task 3: create notifications for request, invoice, and project status events.
- Task 4: add a pending deposit demo state and an unread staff notification to
  the seed.

Assumptions made (flag if wrong):
- Standard requests always have a package because the database relation is
  required. The route still checks for a missing relation and returns a clear
  error rather than creating a zero-value invoice.
- Deposit project names use the company name when supplied, otherwise the
  prospect's name, followed by the package name.

Blockers:
- No safe live-Neon approval readback was run by this agent; it requires creating
  a fresh real prospect record and is left explicitly for Buna's click-through.
