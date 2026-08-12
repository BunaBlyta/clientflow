# Brief — API lane: repair Flow A (run this one first, tonight)

**Written by Buna's Cowork session, 2026-08-12. You own `app/api/**`, `prisma/`,
`docs/ARCHITECTURE.md` and `status/CURRENT-api.md`. Nothing else.**

Read `AGENTS.md`, then `docs/HANDOVER-2026-08-11.md`, then `STATUS.md` and
`status/CURRENT-api.md`.

**Two other agents are working right now in `app/(marketing)/`, `app/(dashboard)/`,
`components/`, `lib/` and `mobile/`.** You will see their half-written files. Do
not open them, do not fix them, and if `npm run verify` fails on a file you do not
own, re-run it and then report it rather than touching it.

**The mobile lane is blocked on task 1 and the web lane is blocked on task 2.**
Commit and push each task separately as it finishes rather than batching all three.

---

## Why this task

Flow A in `docs/SPEC.md` — prospect requests a package, staff approves, client
onboards and pays the deposit — is the single most important path in the project
and the one being demonstrated on Friday. It has two breaks in it. Both were
missed because the two halves either side of each break work correctly, which is
what made them invisible.

### Break 1: the verification code is consumed twice

`app/api/auth/verification/verify/route.ts` and
`app/api/auth/set-password/route.ts` both validate the code against
`verificationCodeHash`, and **both clear it on success**. The intended mobile flow
is two screens — enter code, then choose password — so:

1. `/verification/verify` succeeds, sets `emailVerifiedAt`, sets `isActive: true`,
   and nulls `verificationCodeHash` and `verificationCodeExpiresAt`.
2. `/auth/set-password` receives the same code, finds a null hash, and returns 400
   "Invalid or expired verification code".
3. The account is now active with **no password**. `verifyPassword` correctly
   returns false on a null hash, so login rejects them too. The client is stranded.

This was never caught because the chain proven on 11 August called
`/verification/send` then `/auth/set-password` directly and never `/verify` in
between. The only sequence that has actually run is not the sequence the app
performs.

### Break 2: approving a request creates nothing to look at or pay

`app/api/requests/[id]/route.ts` creates the `User`, creates the `Client`, sets
the request to `APPROVED` and sends the email. There is no `prisma.project.create`
and no `prisma.invoice.create` in the file.

So a client who comes through approval verifies their email, sets a password, logs
in — and finds an empty app. No project, no deposit invoice, nothing to pay. The
payment-gated `Approved → Discovery` transition can never fire for them, because
there is no project to transition. The Stripe payment proven on 11 August was
against seeded `inv-5`, which belongs to a seeded client, not to anyone who came
through this route.

### Break 3: almost nothing creates a notification

`notification.create` appears in exactly one file — the Stripe webhook. SPEC #13
lists eight events. Six of them write nothing, so the notifications screen on both
platforms shows seed rows and payment events and nothing else, whatever the user
does in the app.

---

## Task 1 — make `/verification/verify` a pure check

Validate the code and return `{ verified: true, user }` **without writing
anything**: no `emailVerifiedAt`, no `isActive`, and above all no clearing of
`verificationCodeHash` or `verificationCodeExpiresAt`.

Leave `set-password` exactly as it is. It already validates the code, activates
the account, hashes the password, clears the code and issues a session, all in one
place. One endpoint consumes the code; the other only inspects it.

Nothing currently calls `/verification/verify`, so this is safe to change.

**While you are in `app/api/_lib/verification.ts`:** `CODE_TTL_MS` is 10 minutes.
For a code a client receives by email during onboarding that is tight — a prospect
who reads the email after lunch is locked out and has to resend. Raise it to 30
minutes. It is one constant. If you think that weakens something, say so instead
of changing it.

**Add a test that walks the real sequence** — send, verify, set-password, login —
in that order. That is what a client actually does and nothing covers it today.

**Commit and push this task on its own before starting task 2.** The mobile lane
is waiting on it.

## Task 2 — approval creates a project and a payable deposit invoice

Inside the **existing `$transaction`** in `app/api/requests/[id]/route.ts`, after
the client is created or reused, also create:

**A `Project`**, linked to that client and to the request's package.
- Name it from the request (the prospect's company or name plus the package name
  is fine — pick something readable and say what you picked).
- **Status must be exactly `PENDING`.** This is not a preference — see the hard
  constraint below. Note that `ProjectStatus` has no `APPROVED` value; `AGENTS.md`
  §4 calls the payment-gated transition "Approved → Discovery", which is wrong
  about the name. The enum is `PENDING DISCOVERY DESIGN DEVELOPMENT REVIEW
  LAUNCHED CANCELLED ON_HOLD`. **Do not add an enum value** — that is a migration,
  and migrations are Buna's.
- There is no `prisma/project-state.ts`; only `prisma/invoice-state.ts` exists.
  Write the project status directly. Do not build a project state machine.

**A deposit `Invoice`** against that project.
- **Amount: 50% of the package price**, rounded to 2 decimal places. Currency from
  the package. This is a decision Buna made on 12 Aug — do not change it, and do
  not make it configurable.
- **Type must be exactly `InvoiceType.DEPOSIT`.** Also not a preference — see below.
- **Status `SENT`, with `issuedAt` set**, not `DRAFT`. The client must be able to
  pay it the moment they log in. Route this through `prisma/invoice-state.ts`
  rather than writing `status` directly.
- The remaining 50% is **not** created here. Staff raises the final invoice later
  through `POST /api/invoices`, which is the next brief. That is deliberate — it
  is what Flow C in SPEC describes.

**The hard constraint, and why `PENDING` + `DEPOSIT` are not negotiable.**
`app/api/stripe/webhook/route.ts:73` advances the project only when both of these
hold:

```ts
if (invoice.type === 'DEPOSIT' && project?.status === 'PENDING') {
  // → project moves to DISCOVERY, and a system note is written to the feed
}
```

Get either value wrong and the webhook still returns 200, the invoice still moves
to `PAID`, and **the project silently never leaves its initial status and no system
note is written.** Nothing errors, nothing logs, and the payment gate — the single
most important piece of behaviour in this project — quietly does not exist. Verify
this specific transition by reading the project row back after a test payment, not
by trusting the 200.

**Constraints:**
- All of this goes inside the same transaction as the user/client/request writes.
  A half-approved request with a client but no project is worse than a failure.
- The existing behaviour where a failed verification email does **not** roll back
  the approval must be preserved. Email still happens after the transaction.
- Re-approving an already-approved request must still 409 and must not create a
  second project or a second invoice. Test that specifically.
- A custom-package request has no package and therefore no price. If that case can
  reach this endpoint, handle it explicitly rather than creating an invoice for
  zero — and say in your status file what you decided.

## Task 3 — create notifications for the events that already exist

Add `notification.create` calls for these, inside the transactions that already
perform the state change:

| Event | Who gets notified | `NotificationType` |
|---|---|---|
| Project request submitted (`POST /api/requests`) | staff | `REQUEST_SUBMITTED` |
| Request approved | the client | `REQUEST_APPROVED` |
| Request rejected | the client | `REQUEST_REJECTED` |
| Invoice sent (`PATCH /api/invoices/[id]` → `SENT`) | the client | `INVOICE_ISSUED` |
| Project status changed (`PATCH /api/projects/[id]`) | the client | `PROJECT_STAGE_CHANGED` |

**Every one of those enum values already exists** — the full set is
`REQUEST_SUBMITTED REQUEST_APPROVED REQUEST_REJECTED INVOICE_ISSUED
PAYMENT_SUCCEEDED PAYMENT_FAILED PROJECT_STAGE_CHANGED NEW_NOTE
EXTRA_CHARGE_CREATED`. Use exactly the value named above for each event. **Do not
add new ones** — that is a migration.

Two events are out of scope tonight because their endpoints do not exist yet: a
new note, and an extra charge created. They belong with `POST /api/notes` and
`POST /api/invoices` in the next brief.

Keep it cheap: title and message in plain language a client would understand, not
internal jargon. "Your deposit invoice is ready" not "Invoice inv-9 transitioned
to SENT".

## Task 4 — seed the states this makes possible

`prisma/seed.ts` is yours. Add, so Friday's demo does not depend on running the
whole flow live:

- **A project in `PENDING` with an unpaid `DEPOSIT` invoice in `SENT`** — the exact
  state a new client lands in after task 2. The seed currently has no `PENDING`
  project and no unpaid deposit at all: its four projects are `DEVELOPMENT`,
  `REVIEW`, `LAUNCHED` and `ON_HOLD`. So nothing in seed data exercises the payment
  gate, which is why it was possible for approval to create no project for this
  long without anyone noticing.
- **At least one unread notification for a staff user.** All seven seeded
  notifications are assigned to `clientUser.id` — **no staff user has a single
  notification**, so the staff bell is empty by construction, whatever the
  notifications screen is wired to.

**Do not add a client with two projects — one already exists.** `proj-1` and
`proj-2` both omit `clientId` and fall back to `client.id`, so the first seeded
client (Riverside Cafe) already has two. `docs/SPEC.md` flags this as an edge case,
but the untested part is the *mobile UI*, not the data — that belongs to the mobile
lane, not to you. Leave it alone.

Keep the seed rerunnable — it already is, and that property is what makes it
usable for resetting before a demo.

## Explicitly out of scope

- The six write endpoints in `status/briefs/2026-08-12-write-endpoints-api.md`.
  That is your next task, not this one.
- `POST /api/clients` and `POST /api/projects` — the custom-package flow (SPEC #5)
  is deferred, recorded in `docs/SPEC.md`.
- Staff register, forgot-password, invite-a-teammate (SPEC #2) — cut, recorded in
  `docs/SPEC.md`.
- Any file outside `app/api/**`, `prisma/`, `docs/ARCHITECTURE.md` and your status
  file. Do not wire any frontend to this.
- `npm install`, `prisma migrate`, `npx expo install`. Print the command and stop.
  **If any task here appears to need a schema change, stop and report it** — every
  field needed already exists.
- Worktrees and branches.

## Definition of done

- **Task 1 committed and pushed on its own, first.** Mobile is blocked on it.
- Approving a fresh request produces exactly one project and exactly one deposit
  invoice, **verified by reading the rows back from Neon**, not by the test suite.
  Then log in as that client through the API and confirm the project and invoice
  come back from `GET /api/projects` and `GET /api/invoices`.
- Tests for: the send → verify → set-password → login sequence; approval creating
  exactly one project and one invoice; re-approval returning 409 without
  duplicating either.
- `docs/ARCHITECTURE.md` records the new approval side effects and the notification
  events, because the web and mobile lanes will code against that file.
- `npm run verify` actually run; `npx next build --webpack` is the documented
  fallback for the sandbox port restriction.
- Committed with `git add app/api/ prisma/ docs/ status/` (never `-A`) and pushed.
  If you cannot verify something, commit anyway and say so plainly — do not sit on
  uncommitted work, and do not claim verification you did not do.
- `status/CURRENT-api.md` overwritten and a NEW file in `status/log/`, both in
  plain language a non-engineer could follow.

## Before writing code

Three lines: current state, what you will change, and anything above that is
already stale. Then wait for confirmation.
