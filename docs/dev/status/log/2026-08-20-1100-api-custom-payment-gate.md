### 2026-08-20 11:00 — API agent — gate custom projects on initial payment

Changed:
- Applied the `PENDING` project payment gate to both standard `DEPOSIT` and
  custom `CUSTOM` initial invoices.
- Made a paid custom invoice advance a pending project to `DISCOVERY` through
  the verified Stripe webhook, with an audit note and existing notifications.
- Added tests for unpaid custom blocking, paid custom advancement, and webhook
  behavior; updated `docs/ARCHITECTURE.md` to describe the new contract.

Tried and abandoned (what didn't work, and why):
- The full `npm run verify` command could not complete because an unrelated
  web-lane `date-picker.tsx` lint error stops it before tests and build. The
  web file was left untouched because it belongs to another lane.

Left for next session:
- No API work is pending for this change. The web lane should confirm its
  status-menu error copy is compatible with the new generic payment-gate text.

Assumptions made (flag if wrong):
- A custom project's first `CUSTOM` invoice is the payment that unlocks work,
  and payment should automatically move the project to `DISCOVERY`, matching
  the standard package deposit behavior.

Blockers:
- Repository-wide verification remains blocked by the unrelated web-lane lint
  error noted above.
