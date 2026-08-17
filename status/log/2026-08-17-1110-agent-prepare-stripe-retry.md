### 2026-08-17 11:10 — Agent A — prepare safe Stripe retry

Changed:
- With Buna's approval, changed only Jordan's `$999` test invoice from Payment
  Pending to Failed and cleared its old Stripe Checkout Session reference.
- Used exact ID, email, amount, and status checks before the production update,
  then verified one row changed and both Stripe IDs are empty.

Tried and abandoned (what didn't work, and why):
- The mobile processing screen cannot start another Checkout attempt, and the
  invoice detail intentionally hides Pay while the invoice is Payment Pending.
  Resetting the failed test attempt through the existing invoice lifecycle is
  required to expose Retry payment safely.

Left for next session:
- Buna should reopen the invoice, tap Retry payment, and stop at the Stripe form
  before entering card details. Inspect that new open session in Stripe to prove
  which account the current production deployment is using.

Assumptions made (flag if wrong):
- The `$999` Jordan invoice is disposable sandbox test data and was the exact
  invoice Buna authorized resetting.

Blockers:
- None. Waiting for the new Checkout form to open so its session can be checked
  before another test payment.
