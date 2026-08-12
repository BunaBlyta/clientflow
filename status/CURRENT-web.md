# CURRENT — web UI lane (Agent B)

You own `app/(marketing)/`, `app/(dashboard)/`, `app/(auth)/`, `middleware.ts`,
`components/` and `lib/` only. You are the only writer of this file.

Last updated: 2026-08-12 by Codex — manual AI analytics insight

## What changed

- Dashboard overview and analytics load live invoices, projects, and requests.
  Clients, notifications, the topbar bell, projects, and project requests also use
  the available API contracts with loading and error states.
- Settings packages load from `GET /api/packages`, edit through
  `PATCH /api/packages/[id]`, and create through `POST /api/packages`.
- Invoice creation, project note posting, and client invitation resend use their
  shipped API write endpoints with visible pending/error states.
- The notifications page now marks an individual unread notification through
  `PATCH /api/notifications/[id]` before following its link. “Mark all read” sends
  the same PATCH request to every unread notification with `Promise.all`, updates
  only confirmed server responses, and refreshes from the server if a bulk request
  partially fails.
- The dashboard topbar’s “Log out” action now calls `POST /api/auth/logout` with
  the session cookie, shows a pending state, and redirects to `/login` with a
  router refresh even if the request fails so the user is not left in the menu.
- The custom web app contact section is intentionally disabled per the deferred
  SPEC decision. It keeps the existing copy and links prospects to
  `buna@tetbit.studio` instead of accepting a submission that the app cannot
  deliver to staff. The dead frontend `ContactLead` type, fixture data, and
  Zustand action were removed; the API lane’s Prisma schema was not changed.
- Analytics revenue and turnaround calculations now receive the live package
  records from `GET /api/packages`; the overview and analytics pages both load
  those records before calculating package charts. This fixes the Landing Page
  join from the stale mock ID `pkg-landing` to the seeded ID `pkg-landing-page`.
- The analytics page now has a manual “Generate insight” card. It calls the
  staff-only `POST /api/analytics/insight`, which computes live dashboard numbers
  server-side and requests a short read-only Gemini summary. Missing keys and
  upstream failures appear as an inline error instead of breaking analytics.

## Verification

- `npm run verify`: typecheck passed, lint passed, and all 67 Vitest tests passed.
  The required Turbopack build was blocked by the sandbox process/port
  restriction.
- `npx next build --webpack`: passed; all 30 routes compiled, including the
  logout endpoint, the insight endpoint, and the marketing page.
- The insight change passed the repository typecheck and lint steps. An
  unauthenticated POST returned 401 as expected. The configured Gemini endpoint
  currently returns 404 because `gemini-2.5-flash-lite` is unavailable to new
  users, and the UI displays the route’s graceful error state.
- Signed-in local API verification confirmed `pkg-landing-page`, `proj-2`, and
  paid invoice `inv-4` for 125000 cents. The rendered browser check could not
  run because no browser connection was available in this session.
- No API, Prisma, mobile, or other lane files were changed.

## Handoff notes

- The topbar notification mark-read controls remain a separate follow-up; this task
  wires the notifications page requested here.
- The staff invite control remains intentionally out of scope because staff invites
  are cut from v1 and have no backend endpoint.
- Settings business profile remains local UI only; no API contract exists for it.
- The topbar and settings profile still use the seeded `currentStaffUser`; the
  shipped `GET /api/auth/me` endpoint can replace that identity later.
- The logout request depends on the API lane’s shipped `POST /api/auth/logout`
  route; the UI also navigates away if the request returns an error or cannot
  complete.
- The custom package flow remains deferred: staff manually creates the client,
  project, and invoice after an outside conversation. Do not restore an online
  contact submission until a real delivery path and staff UI exist.
- Package analytics must continue to consume `ManagedPackage` records from the
  API rather than the public marketing fixture package list.
- The Gemini model URL is intentionally the one specified in the task. If Buna
  replaces it after checking Google AI Studio, update the API route contract and
  re-test the manual button.

## Hard rule

Never run `npm install`, `prisma migrate`, or `npx expo install` in this lane.
Commit only owned paths and this file; never use `git add -A`.
