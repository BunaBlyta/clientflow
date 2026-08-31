### 2026-08-13 15:30 — API agent — notification navigation contract

Changed:

- Added nullable Prisma notification targets for projects, invoices, and
  standard project requests, with relations and indexes.
- Serialized `projectId`, `invoiceId`, and `requestId` from both notification
  endpoints.
- Added target IDs to all applicable notification creation flows and seed
  records, plus focused route and metadata tests.
- Documented the response and creation contract in `docs/ARCHITECTURE.md`.

Migration for Buna:

```sh
npx prisma migrate dev --name add-notification-navigation-targets
```

Verification:

- `npm run test`: passed — 34 files, 138 tests.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npx prisma validate`: passed.
- `npx next build --webpack`: passed.
- `git diff --check`: passed.

Notes:

- No migration was run. No frontend, mobile, payment-page, or generated-client
  files were committed.
- Custom inquiries retain nullable targets because they have no
  `ProjectRequest` foreign key; no invalid cross-entity ID was stored.
