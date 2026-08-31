# Notification target data diagnosis

Date: 2026-08-13 15:46
Lane: Web UI

## Finding

The API now returns a valid notification array, but the live staff account’s existing notifications all have `projectId`, `invoiceId`, and `requestId` set to `null`. The web helper correctly maps that case to `/dashboard/notifications`, which makes same-page clicks appear non-functional.

## Required ownership handoff

The API/data lane must apply its migration and ensure newly seeded or newly created applicable notifications carry target IDs. Old records with no target metadata cannot be safely mapped from their text or type.

## Verification

- Authenticated `GET /api/notifications`: HTTP 200, valid JSON array, all observed targets null.
- Tests: 34 files, 138 passed.
- Typecheck, lint, and diff check passed.
