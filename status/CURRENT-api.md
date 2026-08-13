# CURRENT — API & database lane (Agent A)

Last updated: 2026-08-13 15:41 by Codex — regenerate notification Prisma client

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

## Runtime Prisma follow-up

- Confirmed `prisma/schema.prisma` and migration
  `20260813133233_add_notification_navigation_targets` both define nullable
  `projectId`, `invoiceId`, and `requestId` on `Notification`, with indexes and
  `SET NULL` foreign keys.
- Ran `npx prisma generate` to refresh the runtime Prisma Client. The generated
  client is ignored and is not committed.
- Added explicit PATCH route assertions that the three fields are selected on
  both the initial read and the mark-read update.
- The Next.js process serving the app must be restarted after generation so it
  stops using its already-loaded stale client module.

## Follow-up verification

- `npx prisma generate`: passed.
- `npm run test`: passed — 34 test files, 138 tests.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npx next build --webpack`: passed.
- `git diff --check`: passed.
