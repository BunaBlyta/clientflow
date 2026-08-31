### 2026-08-11 11:21 — Codex — login and route protection

Changed:
- Added the web `/login` page with a restrained two-column layout that follows the Clientflow typography and accent rules.
- Added a client-side sign-in form that calls the existing login endpoint, displays loading and error states, rejects non-staff accounts, and safely returns users to an internal `next` path.
- Added `middleware.ts` protection for `/dashboard/**` and `/login`. It verifies the HMAC signature and expiry in the session cookie without loading Prisma into the request boundary.

Tried and abandoned (what didn't work, and why):
- The first production fallback build used `useSearchParams()` directly in the form and failed Next 16 prerendering because it was not inside Suspense. The form now reads the query string at submit time, so `/login` remains statically renderable.
- The required `npm run verify` was run twice. Its Turbopack build fails reproducibly while creating a worker for CSS processing (`Operation not permitted`). The webpack fallback passed instead.

Left for next session:
- Convert one dashboard screen from mock data to Agent A's live API contract, including loading, error, and empty states, and show the result to Buna before moving to another screen.

Assumptions made (flag if wrong):
- The web dashboard is staff-only; successful client credentials show a clear message rather than entering the staff UI.
- The `next` redirect may only target a single-slash internal path, preventing an open redirect.

Blockers:
- `npm run verify` is not green only because Next 16 Turbopack cannot spawn its worker in this environment. Typecheck, lint, tests, and `npx next build --webpack` pass.
