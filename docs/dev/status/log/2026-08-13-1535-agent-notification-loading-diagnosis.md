# Notification loading diagnosis

Date: 2026-08-13 15:35
Lane: Web UI

## Finding

The dashboard notification requests are failing in the API layer before the web can parse or render a response. Prisma rejects the API’s `projectId`, `invoiceId`, and `requestId` notification selections because the running generated client does not yet contain those schema fields.

## Web assessment

The full notifications page and topbar use the existing authenticated `fetchJson` path and preserve their loading/error/retry behavior. No web fix can make this live API request succeed without hiding the backend error or replacing live data.

## Verification

- Direct unauthenticated `GET /api/notifications`: HTTP 401, `Authentication required`.
- Authenticated request error captured in the live Next log: Prisma `Unknown field projectId for select statement on model Notification`.
- Lint and diff check passed; final full test/typecheck are blocked by concurrent API target-field work.
