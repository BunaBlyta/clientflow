### 2026-08-12 09:30 — API agent — Flow A seed coverage

Changed:
- Added a separate seeded client account for Casey Brooks at
  `casey@northwindstudio.com` so the pending-payment demo does not add another
  project to an existing client.
- Added `proj-5` in `PENDING` with a Full Website package and `inv-13` as a
  `SENT` $3,250 deposit invoice.
- Added `notif-8`, an unread new-request notification for the staff account.
- Kept every new record as an upsert so the seed remains safe to rerun.
- Updated the API lane state file with the final task status.

Tried and abandoned (what didn't work, and why):
- I did not run the database seed command against shared Neon because it resets
  existing demo invoice and project states. The code is covered by typecheck;
  Buna can run the seed deliberately when the demo data should be refreshed.
- The normal build again hit the sandbox's Turbopack port restriction; the
  prescribed webpack build passed.

Left for next session:
- Run the seed when ready, then click through a fresh request approval and read
  the created project and invoice back through the client API.
- Verify a Stripe test payment on a pending deposit and confirm the webhook moves
  the project from `PENDING` to `DISCOVERY`.

Assumptions made (flag if wrong):
- The additional demo client is preferable to giving a second project to one of
  the existing clients, preserving the documented multi-project edge case.
- Casey's seeded demo password is `northwind123`, matching the existing seed
  convention for local demonstration accounts.

Blockers:
- No code blocker. Shared Neon was intentionally left unchanged until Buna
  chooses to rerun the resettable seed.
