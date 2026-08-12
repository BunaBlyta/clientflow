# Stripe webhook test coverage — 2026-08-12

Added tests around the payment webhook so the team can rely on its behavior:

- A completed checkout marks the invoice paid.
- A deposit payment moves a pending project to Discovery; other invoice types
  do not move the project.
- A successful payment creates one payment-received notification.
- Delivering the same success event twice does not make a second payment,
  project move, note, or notification.
- A failed payment marks the invoice failed and creates one failure notice.
- A failure received for an already-paid invoice is ignored.
- Requests without a Stripe signature, or with a bad one, are rejected.

The full checks passed through typecheck, lint, and tests. The standard build
was blocked only by the local sandbox's known Turbopack port restriction; the
Webpack build completed successfully.
