# Mobile Stripe cancellation return

Date: 2026-08-13 14:35
Lane: Web UI

## Completed

- Valid mobile Stripe cancellation returns now open the Expo-web project invoices screen at `/projects/<projectId>/invoices` on port 8081.
- Normal web returns and invalid/incomplete mobile parameters still open `/dashboard/invoices`.
- The page continues to state that cancelling checkout leaves the invoice unchanged.

## Verification

- Tests, typecheck, lint, webpack build, and diff check passed.
- No API, mobile, Prisma, webhook, or payment-confirmation code was changed.
