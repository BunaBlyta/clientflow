# Logout endpoint — 2026-08-12

Added `POST /api/auth/logout` so the dashboard can end a session instead of
just navigating away. The route clears the session cookie immediately and
returns `{ loggedOut: true }` whether the visitor had a valid session or not.

The test confirms the cookie is empty, expires immediately, and that a second
logout call without a session still succeeds. Typecheck, lint, and all tests
passed. The regular build was blocked by the local sandbox's known Turbopack
port restriction; the Webpack build completed successfully.
