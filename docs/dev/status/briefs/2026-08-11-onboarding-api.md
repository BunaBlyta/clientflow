# Brief — API lane: the client onboarding chain

**Written by Buna's Cowork session, 2026-08-11. You own `app/api/**`, `prisma/`,
`docs/ARCHITECTURE.md` and `status/CURRENT-api.md`. Nothing else.**

Read `AGENTS.md`, then `docs/HANDOVER-2026-08-11.md`, then `STATUS.md` and
`status/CURRENT-api.md`.

**The web and mobile lanes are blocked on you. Do this first, commit, and push
before they start.**

---

## Why this task

Right now the only client account in the system exists because the seed script
made it. The chain that is supposed to create one — prospect requests work,
staff approves, client gets an email code, sets a password, logs into mobile,
pays the deposit — has a working front half and a working back half with a hole
in the middle. This closes the hole.

Auth with email verification codes is on the mentor's required feature list
(`AGENTS.md` §6). This is that feature, not a side quest.

## What already exists — do not rebuild it

- `POST /api/auth/verification/send` — generates a code, hashes it, emails it
  via Resend. Deliberately returns a generic `{ sent: true }` even for unknown
  emails so it cannot be used to enumerate accounts. **Keep that property.**
- `POST /api/auth/verification/verify` — validates the code, sets
  `emailVerifiedAt`, sets `isActive: true`, clears the code. Returns the user.
- `app/api/_lib/resend.ts` — `sendVerificationEmail`. `RESEND_API_KEY` is set in
  `.env`. `RESEND_FROM_EMAIL` falls back to `onboarding@resend.dev`.
- `ProjectRequest` model, with `status`, `packageId`, `clientId` and
  `reviewedAt` already on it. No schema change should be needed.
- `GET /api/requests` — reads the pending queue.

## The gap, in order

### 1. `POST /api/requests` — public

Creates a `ProjectRequest` from the landing page form: name, email,
`packageId`, optional `companyName` and `message`. Status `PENDING`.

Public and unauthenticated, like `GET /api/packages`. Validate the body
properly and reject an unknown or inactive `packageId` with a 400. Do not
create a `User` or `Client` here — a rejected request must never have touched
real client data.

### 2. `PATCH /api/requests/[id]` — staff only

Approve or reject. Staff-only, same auth and status-code ordering as the
existing `PATCH /api/invoices/[id]`: 401 → 403 for clients → 400 on a bad body
→ 404 → 409 on an illegal transition. A request that is already `APPROVED` or
`REJECTED` cannot be transitioned again.

**On approve, in one `prisma.$transaction`:**

- Create the `User` (role `CLIENT`, `isActive: false`, no password yet) and the
  `Client`, unless a `User` with that email already exists — in which case link
  the existing one rather than creating a duplicate.
- Set the request to `APPROVED`, with `clientId` and `reviewedAt`.

Then, **outside** the transaction, trigger the verification email by the same
path `/api/auth/verification/send` uses. Email failure must not roll back an
approval that already happened — return success with a flag indicating the
email failed, and log it. A staff member can resend.

**On reject:** set `REJECTED` and `reviewedAt`. Create nothing else. No `User`,
no `Client`, no `Project`. This is an edge case named in `docs/SPEC.md` — test
it explicitly.

### 3. `POST /api/auth/set-password`

**This is the missing link that currently breaks the whole chain.** `verify`
activates the user but never sets a password, and `POST /api/auth/login`
requires one — so today a client can verify their email and still be unable to
log in.

Accept email, code and the new password. Re-validate the code (do not trust a
client-side claim that verification already happened), hash the password the
same way the login route expects, clear the code, and return a session the same
shape `login` returns so mobile can go straight into the app.

Reject a weak password with a 400 and a message a person can act on. Reject an
expired or wrong code with the same generic error `verify` already uses.

## Tests

Vitest, matching the existing API test style. At minimum:

- Approving a request creates exactly one `User` and one `Client`.
- **Rejecting creates no `User`, `Client` or `Project`** — the SPEC edge case.
- Approving an already-approved request returns 409.
- A client-role token gets 403 on `PATCH /api/requests/[id]`.
- `set-password` with an expired code fails and does not set a password.

## Do not

- Do not change `prisma/schema.prisma`. If you are convinced a field is
  genuinely missing, stop and say so rather than migrating.
- Do not run `prisma migrate` or `npm install`.
- Do not touch `app/(dashboard)/`, `app/(marketing)/`, `components/`, `lib/` or
  `mobile/`.
- Do not create a git worktree or branch.
- Do not weaken the account-enumeration protection on `verification/send`.

## Definition of done

- `npm run verify` actually run. Turbopack fails in the sandbox for
  environmental reasons; `npx next build --webpack` is the fallback.
- The full chain exercised against the real database, not just unit tests:
  create a request, approve it, confirm the code email is actually sent, set a
  password with that code, then log in with it and get a session back.
- Committed with `git add app/api/ status/ docs/` (never `-A`) and **pushed**.
- `status/CURRENT-api.md` overwritten and a NEW file in `status/log/`, plain
  language, including what you tried and abandoned.

## Before writing code

Three lines: current state, what you will change, and anything in this brief
that is already stale. Then wait for confirmation.
