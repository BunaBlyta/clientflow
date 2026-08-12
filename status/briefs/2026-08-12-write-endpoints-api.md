# Brief — API lane: the missing write endpoints

**Written by Buna's Cowork session, 2026-08-12. You own `app/api/**`,
`docs/ARCHITECTURE.md` and `status/CURRENT-api.md`. Nothing else.**

Read `AGENTS.md`, then `docs/HANDOVER-2026-08-11.md`, then `STATUS.md` and
`status/CURRENT-api.md`.

**Two other agents are running right now in `app/(marketing)/`, `app/(dashboard)/`,
`components/`, `lib/` and `mobile/`.** You will see their half-written files.
Do not open them, do not fix them, and if `npm run verify` fails on a file you do
not own, re-run it and then report it rather than touching it.

---

## Why this task

Every remaining unfinished feature on the must-have list is blocked on a write
endpoint that does not exist. The API is read-only everywhere except auth, Stripe,
requests, and the two PATCH endpoints added on 11 August. Concretely, today:

- `components/dashboard/create-invoice-dialog.tsx` writes a new invoice to the
  Zustand store and nothing else. Staff creates an invoice, it appears, they
  refresh, it is gone. This is the same failure that got the invoice row actions
  hidden on 11 Aug.
- The project note composer is disabled, so the shared activity feed (SPEC #9) is
  read-only for both staff and clients.
- Marking a notification read has nowhere to go (SPEC #13).
- `/dashboard/settings` has a working-looking package editor wired to nothing
  (SPEC #12).
- The signed-in staff user is hardcoded — `currentStaffUser` from
  `lib/mock-data.ts` — because there is no endpoint that returns the current user.

**None of the six endpoints below needs a schema change.** Every field already
exists in `prisma/schema.prisma`: `Notification.readAt`, `Package.isActive`,
`Invoice.status/dueDate/description`, `Note.content/authorId/isSystem`. If you
conclude a migration is required, **stop and report it** — do not run
`prisma migrate`, and do not work around the schema.

## What to build, in this order

**Item 0 is a bug fix and comes before everything else — the mobile lane is
blocked on it right now.** After that: 1 and 2 unblock the web lane's next task,
5 is the cheapest and most visible, 6 is the one that may not be worth it.

### 0. `POST /api/auth/verification/verify` consumes the code, so set-password then fails

Both `verify/route.ts` and `set-password/route.ts` validate the verification code
against `verificationCodeHash`, and **both clear it on success**. A client who
follows the intended mobile flow — enter code on the verify screen, then choose a
password on the next screen — hits this:

1. `/verification/verify` succeeds, sets `emailVerifiedAt`, sets `isActive: true`,
   and nulls `verificationCodeHash` and `verificationCodeExpiresAt`.
2. `/auth/set-password` is called with the same code, finds a null hash, and
   returns 400 "Invalid or expired verification code".
3. The client is now active with **no password**. `verifyPassword` correctly
   returns false on a null hash, so login rejects them too. They are stuck between
   two screens with no way forward except resending a new code from the previous
   screen.

This was never caught because the chain proven on 11 August called
`/verification/send` and then `/auth/set-password` directly, never `/verify` in
between — so the only path that has actually run end to end is not the path the
mobile app is being built to use.

**The fix: make `/verification/verify` a pure check.** It should validate the code
and return `{ verified: true, user }` **without writing anything** — no
`emailVerifiedAt`, no `isActive`, and above all no clearing of the code. Leave
`set-password` exactly as it is: it already validates, activates, hashes the
password, clears the code and issues a session, all in one place. One endpoint
consumes the code; the other only inspects it.

Nothing currently calls `/verification/verify`, so this is safe to change.

Add a test that walks the real sequence — send, verify, set-password, login — in
that order. It is the sequence a client will actually perform and there is no test
covering it today.

**While you are in there:** `CODE_TTL_MS` in `app/api/_lib/verification.ts` is
10 minutes. For a code a client receives by email during onboarding, that is
tight — a prospect who reads the email over lunch is locked out and has to resend.
Raise it to 30 minutes. It is one constant. If you think that weakens something,
say so instead of changing it.

### 1. `POST /api/invoices` — create an invoice

Staff only. Body: project, invoice type, amount, currency, optional due date,
optional description. Derive `clientId` from the project on the server; never
trust it from the body.

- New invoices start at `DRAFT`. Route the initial state through
  `prisma/invoice-state.ts` rather than writing `status` directly — that file is a
  tested state machine and it exists for exactly this.
- Creating an invoice at `PAID` or `PAYMENT_PENDING` must be rejected. Stripe's
  confirmed webhook is the only path to `PAID`. This is an integrity rule, not a
  validation preference.
- **Return the created record through the exact serializer `GET /api/invoices`
  already uses**, same field names, same `amountCents` treatment. The web dialog
  will render what you return; a second shape is how the mobile `InvoiceKind`
  drift happened last week.

### 2. `POST /api/notes` — post a note to a project

Both roles. Body: project and the note text.

- The author is the session user. Never accept an author from the body.
- `isSystem` is false for anything posted here — system notes are written only by
  the status-change paths that already write them.
- **A client may only post to a project they own.** This is the client-data-
  isolation edge case in `docs/SPEC.md`, the one flagged as most likely to look
  fine in a demo while being broken underneath. Enforce it server-side and add a
  test for the cross-client case specifically, not just the happy path.
- Notes are immutable — no PATCH, no DELETE, do not add them.
- The DB column is `content`; `GET /api/notes` already serializes it as `body`.
  **Accept and return `body`** so both sides of the endpoint match.

### 3. `PATCH /api/notifications/[id]` — mark read

- Only the notification's own user may mark it. A notification belonging to
  someone else is a 404, not a 403 — do not confirm it exists.
- Sets `readAt`. Marking an already-read notification returns 200 with the record,
  not an error — same reasoning as `transitionInvoiceStatus` returning true for a
  same-to-same transition. The UI will retry, and a duplicate must be harmless.
- Return the record in the same shape `GET /api/notifications` returns.

### 4. `POST /api/packages` and `PATCH /api/packages/[id]`

Staff only. `GET /api/packages` stays public and unchanged.

- **Deactivate via `isActive: false`. Never delete a package.** Projects and
  requests reference it; a delete orphans historical data and would break the
  analytics turnaround-by-package aggregation.
- `price` is `Decimal(12,2)` in the database and the existing serializer emits it
  as major currency units. Accept it in the same units you emit. Do not introduce
  a second convention.
- `slug` is unique — a collision is a 409 with a usable message, not a 500.
- Changing a package's price must not retroactively change any existing project or
  invoice. Confirm that in a test; if the schema copies the price onto the project
  it is already fine, and if it does not, say so plainly in your status file
  rather than changing the schema.

### 5. `GET /api/auth/me` — the signed-in user

Returns id, name, email and role for the session user, plus `clientId` when the
role is client. 401 with no body when there is no valid session.

This is small and it removes a hardcoded fake name from every dashboard screen.

### 6. Resend a client's app invitation

SPEC #7 lists it as a table action. Staff only. Re-issues a verification code and
re-sends the email through the existing Resend path used by request approval.

- Return `{ emailSent: boolean }` the way the approval path already does — "sent"
  and "the email did not go out" must be distinguishable by the caller.
- The account-enumeration protection on the public verification-send endpoint does
  not apply here: the caller is authenticated staff acting on a known client.
- **If this turns out to need more than a thin wrapper over the existing
  verification-send logic, skip it and say so.** It is the least important item
  here and the deadline is Friday.

## Explicitly out of scope

- **`POST /api/clients` and `POST /api/projects`.** The custom-package flow
  (SPEC #5 — staff manually creates a client, project and invoice after an offline
  conversation) is deferred. Decided 12 Aug, recorded in `docs/SPEC.md`.
- **Staff register, forgot-password and invite-a-teammate (SPEC #2).** Cut on
  12 Aug — the client onboarding chain already demonstrates email-verification auth
  end to end. Recorded in `docs/SPEC.md`. Do not build any part of it.
- Any file outside `app/api/**`, `docs/ARCHITECTURE.md` and your status file. In
  particular: do not wire the frontend to these endpoints, do not touch
  `lib/store.ts`, and do not delete `currentStaffUser` from `lib/mock-data.ts` —
  that is the web lane's job.
- `npm install`, `prisma migrate`, `npx expo install`. Print the command and stop.
- Worktrees and branches.

## Definition of done

- **Item 0 first, committed and pushed on its own, before you start item 1.** The
  mobile lane is blocked on it and is waiting.
- All six endpoints (or five, with #6 skipped and explained) work against the real
  Neon database, **verified by calling them and then reading the row back** — not
  by the test suite alone. Every serious bug this week was green on typecheck,
  lint, tests and the build.
- Tests for the three that can go wrong with money or privacy: creating an invoice
  in an illegal state, a client posting a note to a project they do not own, and a
  duplicate mark-read.
- **`docs/ARCHITECTURE.md` records every new request and response shape.** The web
  and mobile lanes will code against that file, not against this brief.
- `npm run verify` actually run; `npx next build --webpack` is the documented
  fallback for the sandbox port restriction.
- Committed with `git add app/api/ docs/ status/` (never `-A`) and **pushed**.
  If you cannot verify something, commit anyway and say so plainly — do not sit on
  uncommitted work, and do not claim verification you did not do.
- `status/CURRENT-api.md` overwritten and a NEW file in `status/log/`, both in
  plain language a non-engineer could follow.

## Before writing code

Three lines: current state, what you will change, and anything above that is
already stale. Then wait for confirmation.
