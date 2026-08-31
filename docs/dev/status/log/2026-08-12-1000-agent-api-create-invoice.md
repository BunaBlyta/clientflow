### 2026-08-12 10:00 — API agent — create invoice endpoint

Changed:
- Added staff-only `POST /api/invoices` with project, type, amount, currency,
  due-date, and description validation.
- The project supplies the invoice's client on the server; a body client ID is
  ignored.
- New invoices always start as `DRAFT` through the tested invoice state helper.
  Attempts to start at `PAID` or `PAYMENT_PENDING` return a validation error.
- The response uses the same serializer as the existing invoice GET route.
- Added an in-app `EXTRA_CHARGE_CREATED` notification for the client in the same
  transaction and tests for authorization, illegal payment states, ownership,
  notification, and missing projects.
- Documented the request and response contract in the architecture handoff.

Tried and abandoned (what didn't work, and why):
- The first focused test exposed an optional-description validation bug for
  requests that omitted the field. The check was corrected and the full focused
  test plus typecheck then passed.

Left for next session:
- Run the full repository verification and commit/push this endpoint separately.
- Implement `POST /api/notes` with client project ownership checks and opposite-
  side notifications.

Assumptions made (flag if wrong):
- New invoice creation uses `EXTRA_CHARGE_CREATED` for all invoice types because
  this route is the missing event for newly created charges; it does not mark an
  invoice as sent or payable.
- Amounts are entered in major currency units, matching package responses, and
  are normalized to exactly two decimal places before Prisma writes them.

Blockers:
- No live Neon write/readback was run by this agent; it would mutate shared demo
  data. The endpoint is covered by route tests and the repository verification
  gate.
