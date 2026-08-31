# Manual AI analytics insight — 2026-08-12

Added a staff-only `POST /api/analytics/insight` route. It reads live active
packages, projects, and invoices with Prisma, uses the shared analytics helpers
for revenue over time, revenue by package, turnaround, and outstanding invoices,
then sends only those computed numbers to Gemini. The analytics page exposes a
manual “Generate insight” button and renders the returned 2–3 sentence summary
or an inline error; it does not auto-fetch, chat, or accept follow-up questions.

The route rejects unauthenticated requests with 401. The configured Gemini
endpoint currently returns 404 because `gemini-2.5-flash-lite` is unavailable to
new users, so the route returns a safe 502 and the page shows its error state.
The requested model URL was left unchanged pending Buna’s Google AI Studio
choice.

Verification: typecheck, lint, and 67 Vitest tests passed. `npm run verify` could
not complete its Turbopack build because the sandbox disallows the process/port
operation; `npx next build --webpack` passed with all 30 routes compiled.
