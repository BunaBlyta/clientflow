### 2026-08-12 10:23 — Codex — marketing request API

Changed:
- Replaced the marketing package form's Zustand submission with `POST /api/requests`.
- Added an inline error state for API validation and network failures; form data stays intact after failure.
- Kept the existing success state and only resets the form after a successful API response.
- Removed the phone input because it is not part of the documented request contract and the API does not persist it.

Tried and abandoned (what didn't work, and why):
- The required Turbopack build could not complete because the sandbox forbids the process/port operation used by Turbopack.
- The final webpack fallback compiled the app but failed on an unrelated concurrent API-lane export in `app/api/packages/route.ts`; an earlier webpack fallback passed before that edit landed.

Left for next session:
- Browser click-through of the public request form can be done when a browser backend is available.
- Package cards still read the existing frontend package source; only form submission was in scope here.

Assumptions made (flag if wrong):
- The public API contract is authoritative, so the form should collect only fields the endpoint can persist.

Blockers:
- No browser click-through was requested or available in this session. Typecheck, lint, and all 42 tests passed; the final production build remains blocked by the unrelated API-lane route type error.
