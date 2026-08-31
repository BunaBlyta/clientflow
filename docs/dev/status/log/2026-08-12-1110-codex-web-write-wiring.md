### 2026-08-12 11:10 — Codex — web write wiring

Changed:
- Connected settings package loading, creation, and editing to the package API.
- Connected invoice creation to the invoice API and refreshed project detail from the returned invoice.
- Enabled project note posting with an inline pending, success, and error state.
- Enabled client invitation resend with an inline pending state and delivery-failure message.
- Extended the shared fetch helper for authenticated write requests.

Tried and abandoned (what didn't work, and why):
- The required Turbopack build could not run because the sandbox forbids its process/port operation. The documented webpack fallback passed.
- No local mock fallback was retained for any of the four flows; failures remain visible and preserve input where applicable.

Left for next session:
- Replace the remaining hardcoded staff identity with `GET /api/auth/me`.
- Decide whether the public pricing cards should also load live packages after settings changes.
- Staff invite and business-profile controls remain intentionally out of scope.

Assumptions made (flag if wrong):
- The package API's `estimatedDuration` is the replacement for the former mock-only turnaround field, and API prices are major currency units.
- New invoices intentionally remain drafts because the shipped API contract creates them in `DRAFT`; the dialog copy was updated accordingly.

Blockers:
- Turbopack remains blocked by the sandbox process/port restriction; webpack production build passed.
