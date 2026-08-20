# CURRENT — API & database lane (Agent A)

Last updated: 2026-08-20 11:00 by Codex — gate custom projects on initial payment

## What changed

- Custom projects now use the same payment gate as standard package projects.
  While a project is `PENDING`, staff cannot move it to another working stage
  until its oldest initial invoice is paid. The initial invoice is `DEPOSIT` for
  a standard package and `CUSTOM` for a custom project.
- A verified Stripe payment for either a `DEPOSIT` or `CUSTOM` invoice moves a
  pending project to `DISCOVERY` and writes a matching system note. Duplicate
  webhook deliveries remain idempotent.
- Updated project-status tests, Stripe-webhook tests, and the API architecture
  contract. The custom flow now has coverage for both unpaid blocking and paid
  advancement.

## Verification

- Full Vitest suite: 38 files, 173 tests passed.
- API-owned ESLint files passed.
- `node_modules/.bin/next build --webpack` passed and included all API routes.
- `npm run verify` is blocked by an unrelated web-lane error in
  `components/dashboard/date-picker.tsx` (`react-hooks/set-state-in-effect`).
  It also reports the two existing `no-img-element` warnings in
  `components/marketing/mobile-app-section.tsx`.

## Handoff

- This task changes only `app/api/projects/[id]`, `app/api/stripe/webhook`, and
  `docs/ARCHITECTURE.md`, plus their tests.
- The default Turbopack build may still hit the known sandbox-only process or
  port-binding panic; the webpack build is the verified fallback.
- Real Stripe webhook delivery still requires the configured Stripe listener
  or deployed webhook secret.
