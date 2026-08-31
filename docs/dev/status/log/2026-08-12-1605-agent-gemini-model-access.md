# Gemini model access and insight grounding — 2026-08-12

Added project-stage counts to the analytics insight prompt so the request now
contains every dashboard number it asks Gemini to discuss. Added six focused
route tests covering 401/403 auth, missing configuration, upstream failure,
malformed model output, success parsing, and stage-data grounding.

Tested the configured key directly with curl in the requested order:
`gemini-3.1-flash-lite`, `gemini-3.5-flash-lite`, then `gemini-2.5-flash`. All
returned 404. Additional models explicitly listed by Google’s model catalog also
returned 404; the key can list models but cannot currently generate with them.
The route therefore remains on the requested endpoint and safely returns its
inline error until Buna supplies a key with generation access. No model was
changed to a known-nonworking replacement.

Updated `AGENTS.md` to record Gemini’s free-tier/lower-cost rationale and added
the insight endpoint contract to `docs/ARCHITECTURE.md`. The API route touch is
called out in `CURRENT-web.md`.

Verification: typecheck, lint, and 73 Vitest tests passed. `npm run verify` could
not complete its Turbopack build because the sandbox disallows the process/port
operation; `npx next build --webpack` passed with all 30 routes compiled.
