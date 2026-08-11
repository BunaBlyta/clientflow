# CURRENT — Stripe & invoices vertical (Agent B)

**You are the only writer of this file. Overwrite it before you stop.
Do not edit another agent's CURRENT-*.md.**

Last updated: 2026-08-11 by Claude (Cowork) — initial setup

## What exists

- **Nothing of Stripe.** No `app/api/stripe/`, no checkout, no webhook. This is
  the largest unfinished required feature.
- `prisma/invoice-state.ts` — the invoice status state machine, already written
  and tested (4 Vitest tests). Use it; do not reimplement status rules.
  Allowed: DRAFT→SENT/VOIDED, SENT→PAYMENT_PENDING/VOIDED,
  PAYMENT_PENDING→PAID/FAILED/VOIDED, PAID→REFUNDED, FAILED→PAYMENT_PENDING/VOIDED.
  VOIDED and REFUNDED are terminal. A same-to-same transition returns true on
  purpose — that is what makes duplicate webhooks idempotent. Do not "fix" it.
- 11 seeded invoices in the database covering every status.
- Web `app/(dashboard)/dashboard/invoices/` and the invoice row-actions and
  create-invoice dialog exist, on mock data.
- Mobile has a **fake** checkout at
  `mobile/app/(app)/projects/[id]/invoices/[invoiceId]/checkout.tsx` — offers a
  succeeds card and a declines card, moves the invoice to PAYMENT_PENDING then
  after a delay to PAID or FAILED. Replace the fakery, keep the shape.
- `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` are already in `.env`.

## Your job

1. Stripe Checkout for an invoice.
2. **The webhook, and get this right — it is the one piece where a bug means
   wrong money, not a wrong pixel.** Signature-verified, idempotent, and the
   only thing allowed to move an invoice to PAID. A client clicking "Pay" must
   never set PAID by itself (AGENTS.md §2, non-negotiable #3).
3. The one payment-gated project transition: Approved → Discovery fires on a
   confirmed deposit-invoice webhook. Every other project status change is a
   manual staff action.
4. Vitest tests over the webhook handler using `prisma/invoice-state.ts`.
   No invoice/payment logic ships untested (AGENTS.md §3).

## Local webhooks

Stripe cannot reach localhost. Buna needs to run, in a spare terminal:

```
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

That prints a signing secret for `.env` as `STRIPE_WEBHOOK_SECRET`. Trigger real
events with `stripe trigger payment_intent.succeeded`. Ask Buna to start it
before you need it.

## Yours to touch

`app/api/stripe/**`, `app/api/invoices/**`, `prisma/invoice-state.ts`,
`components/dashboard/invoice-*`, `components/dashboard/create-invoice-dialog.tsx`,
`app/(dashboard)/dashboard/invoices/**`,
`mobile/app/(app)/projects/[id]/invoices/**`, and this file.
