# Dashboard logout wiring — 2026-08-12

The dashboard topbar no longer treats “Log out” as a link to the home page. It
now sends `POST /api/auth/logout` with credentials, shows a short loading state,
and refreshes middleware state after replacing the route with `/login`. If the
request fails, it still leaves the dashboard immediately so the menu cannot
leave the user stuck.

Verification: typecheck, lint, and 66 Vitest tests passed. `npm run verify` could
not complete its Turbopack build because the sandbox disallows the process/port
operation; `npx next build --webpack` passed with all 29 routes compiled.
