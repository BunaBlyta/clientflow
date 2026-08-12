### 2026-08-12 09:25 — API agent — notification side effects

Changed:
- New requests now notify every staff user inside the request-creation
  transaction.
- Approved requests notify the newly onboarded client inside the approval
  transaction.
- Invoices moving to `SENT` notify the invoice's client in the same transaction.
- Project status changes notify the project's client alongside the system note.
- Rejected requests notify an already-linked client when one exists, without
  creating an account for a new rejected prospect.
- Added tests and documented the notification types and recipients.

Tried and abandoned (what didn't work, and why):
- The first focused test run exposed stale mock call counts between approval
  cases. The test now clears its mocks before each case; no production approach
  was abandoned.

Left for next session:
- Task 4: add a pending deposit demo state and an unread staff notification to
  the rerunnable seed.
- New-note and extra-charge notifications remain with their future POST routes.

Assumptions made (flag if wrong):
- A request rejection cannot notify a prospect who has no account because the
  project deliberately does not create users until approval.
- Repeatedly setting an invoice to `SENT` is not a new issuance event, so it does
  not create a duplicate notification.

Blockers:
- None for the notification changes.
