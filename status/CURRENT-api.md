# CURRENT — API & database lane (Agent A)

**You own `app/api/**` and `prisma/` only. You are the only writer of this file.
Overwrite it before you stop. Never edit another lane's CURRENT-*.md.**

Last updated: 2026-08-11 by Claude (Cowork) — lane setup

## Hard rule: you do not run migrations or installs

**Never run `prisma migrate` or `npm install` yourself.** Print the exact command
and stop — Buna runs it. Three agents share this checkout; a concurrent migration
corrupts migration history against a live Neon database, and a concurrent install
corrupts the lockfile. These are the only two failures here that are quiet and
painful to undo.

## What exists

- `POST /api/auth/login` — email + password, returns `{ user, token }`, also sets
  an HTTP-only cookie. Verified against real seeded data.
- `GET /api/projects/:id` — auth-protected, accepts cookie or `Authorization:
  Bearer`, returns a flat shape (IDs only, no nested relations), ISO date strings,
  404 for a client requesting another client's project. **Copy this route's
  conventions for everything you add.**
- `app/api/_lib/auth.ts` — HMAC-SHA256 signed stateless tokens, scrypt password
  hashing, throws at load if `SESSION_SECRET` is missing in production.
- `prisma/invoice-state.ts` — invoice status state machine, 4 passing tests. Use
  it; do not reimplement status rules. A same-to-same transition returning true is
  deliberate — that is what makes duplicate webhooks idempotent.
- Database live and seeded: 3 packages, 4 projects, 11 invoices covering every
  status, 13 notes, 7 notifications, 3 requests.
- The `User` table already has `verificationCodeHash`, `verificationCodeExpiresAt`,
  and the reset/invite token columns. **No migration needed for verification codes.**
- `RESEND_API_KEY`, `STRIPE_SECRET_KEY` and `SESSION_SECRET` are all in `.env`.

## Your job, in dependency order

1. **Verification-code endpoints.** One to generate a code, hash it into the
   existing columns with an expiry, and email it via Resend. One to check a
   submitted code. Mobile currently compares against the constant `'123456'` and
   sends no email at all — this is a required feature sitting at zero.
2. **Data routes:** `GET /api/projects` (list), `/api/clients`, `/api/notes`,
   `/api/notifications`, `/api/requests`. The web and mobile lanes are blocked on
   these, so they come before Stripe.
3. **Stripe, last and most carefully.** Checkout, plus a signature-verified,
   idempotent webhook that is the *only* thing allowed to move an invoice to PAID
   (AGENTS.md §2, non-negotiable #3). Also the one payment-gated project
   transition: Approved → Discovery on a confirmed deposit webhook. Tests over the
   webhook handler using `prisma/invoice-state.ts` — no payment logic ships
   untested. Webhooks cannot reach localhost; ask Buna to run
   `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

## Known contract mismatches

- `Project.packageId` is nullable in Prisma but required in both frontend types.
  Prisma is right (AGENTS.md §4 — custom projects have no package). Return
  `string | null`; the frontend lanes adapt.
- Prisma has `description`, `startedAt`, `launchedAt` that no frontend type uses.
  Do not return them until a screen needs them.
- `lib/types.ts` and `mobile/lib/types.ts` belong to the other lanes. Propose
  changes through Buna; do not edit them.

## Yours to touch

`app/api/**`, `prisma/`, `docs/ARCHITECTURE.md`, and this file. Nothing in
`app/(marketing)`, `app/(dashboard)`, `components/`, `lib/`, or `mobile/`.
