# CURRENT — API & database lane (Agent A)

Last updated: 2026-08-13 15:30 by Codex — notification navigation contract

## What changed

- Added nullable `projectId`, `invoiceId`, and `requestId` fields to the
  Prisma `Notification` model, with nullable relations and indexes.
- `GET /api/notifications` and `PATCH /api/notifications/:id` now return all
  three target IDs directly, including `null` when a notification has no target.
- Added target metadata to every standard notification flow: project requests,
  invoices, Stripe payment success/failure, project status changes, and notes.
- Updated seed notification records with project and invoice targets. The seed
  request notification links to `req-1` after its request is created.
- Added focused serialization and creation-metadata tests, and documented the
  contract in `docs/ARCHITECTURE.md`.

Custom inquiries still use the existing `REQUEST_SUBMITTED` type but are not
`ProjectRequest` records, so their three target fields remain `null`. No false
foreign-key target was introduced.

## Migration for Buna

Run this exact command after reviewing and deploying the change:

```sh
npx prisma migrate dev --name add-notification-navigation-targets
```

This task did not run a migration. `npx prisma validate` and `npx prisma
generate` were run locally; generated client output is ignored and was not
committed.

## Verification

- `npm run test`: passed — 34 test files, 138 tests.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npx prisma validate`: passed.
- `npx next build --webpack`: passed; all app and API routes compiled.
- `git diff --check`: passed.

## Handoff

- Frontends should navigate using the serialized target IDs and never parse
  notification text or infer targets from notification type.
- The untracked `public/logo.png` belongs to another lane and was not touched
  or staged.
