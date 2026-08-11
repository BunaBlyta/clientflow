### 2026-08-11 11:25 — Agent A — verification, list routes, and Stripe

Changed:
- Added Resend-backed verification-code send/check endpoints using hashed, expiring codes.
- Added authenticated projects, clients, notes, notifications, and staff request list routes.
- Added Stripe Checkout creation, signed webhook verification, idempotent invoice success/failure handling, and the payment-gated project transition.
- Added focused tests for valid, tampered, and expired Stripe webhook signatures.

Tried and abandoned (what didn't work, and why):
- The first two `npm run verify` attempts were blocked by another Next.js build already running in the shared checkout.
- After the lock cleared, `next build` failed in both normal and approved escalated runs because Turbopack could not create a subprocess and bind a port in this environment. Typecheck, lint, and tests passed each time.

Left for next session:
- Frontend lanes can replace mock data with the new list endpoints.
- Stripe webhook behavior still needs a live Stripe CLI/manual test against a configured `STRIPE_WEBHOOK_SECRET`.

Assumptions made (flag if wrong):
- Verification endpoints use `/api/auth/verification/send` and `/api/auth/verification/verify` and accept email/code JSON bodies.
- A deposit confirmation moves the schema’s `PENDING` project to `DISCOVERY`; the schema has no `APPROVED` project status.
- List endpoints return arrays directly, matching the existing detail route’s direct-object response style.

Blockers:
- Production build verification is blocked by the environment-level Turbopack subprocess/port restriction, not by a reported TypeScript or lint error.
