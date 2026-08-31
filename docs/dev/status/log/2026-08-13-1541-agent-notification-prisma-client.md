### 2026-08-13 15:41 — API agent — refresh notification Prisma client

Changed:

- Verified the notification schema and generated migration both contain
  `projectId`, `invoiceId`, and `requestId`, including indexes and nullable
  foreign keys.
- Ran `npx prisma generate` so the runtime Prisma Client accepts all three
  fields.
- Added focused PATCH route assertions for target-field selection and retained
  the GET serialization coverage.

Verification:

- `npx prisma generate`: passed.
- `npm run test`: passed — 34 files, 138 tests.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npx next build --webpack`: passed.
- `git diff --check`: passed.

Handoff:

- Restart the running Next.js server after generation; a process that was
  already running can retain the old Prisma Client in memory.
- The migration directory was created by the user-run migration and is included
  in this API/Prisma commit. No new migration was created by this follow-up.
