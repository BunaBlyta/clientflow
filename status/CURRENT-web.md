# CURRENT — web lane

**Owner: the web agent. You are the only writer of this file. Overwrite it before
you stop. Do not edit the other CURRENT-*.md files.**

Last updated: 2026-08-11 by Claude Code

## State

- **9 dashboard/marketing routes exist, all on mock data:** `/`, `/dashboard`,
  `/dashboard/clients`, `/dashboard/projects`, `/dashboard/projects/[id]`,
  `/dashboard/invoices`, `/dashboard/analytics`, `/dashboard/notifications`,
  `/dashboard/settings`.
- New this session: the project detail page (client info, invoices, a shared
  activity/notes feed with a post-note form), Settings (editable packages, a
  team/invite tab, a business-profile tab), a full Notifications page (all/unread,
  mark-all-read), and Analytics (12-month revenue trend, revenue by package,
  turnaround by package as a new bar chart, a pipeline-by-stage funnel, an
  invoices-by-status breakdown). Sidebar nav gained an "Analytics" entry.
- Packages are now genuinely editable: `lib/store.ts` holds `packages` state and
  an `updatePackage` action, and the marketing pricing page
  (`components/marketing/packages-and-request.tsx`) now reads packages from the
  store instead of a static import, so a Settings edit really does flow through
  to the public pricing page (matches AGENTS.md sec. 4: packages are the single
  source of truth for both surfaces). `lib/analytics.ts` gained
  `invoicesByStatus`, `projectsByStage`, and `overallAverageTurnaroundDays` to
  back the new Analytics page.
- **Fixed a real, pre-existing bug in `components/ui/tabs.tsx` (and the same
  root cause in `separator.tsx`/`scroll-area.tsx`):** `app/globals.css` defined
  the `data-horizontal`/`data-vertical` Tailwind variants as matching a bare
  boolean attribute, but Base UI's orientation-aware primitives only ever emit
  `data-orientation="horizontal"|"vertical"` — so those variants silently never
  matched, and every `Tabs` list (including the pre-existing Projects
  Projects/Requests tabs) rendered as a broken vertical stack instead of a
  horizontal tab bar. Fixed by matching on the attribute's value instead of its
  presence. This was already broken before this session; it just wasn't caught
  because nobody had looked at the Projects page's tabs closely in a browser.
- Not built: the whole Stripe flow (waiting on backend), client detail is not a
  separate page (out of scope per spec — client info lives inline on project
  detail).
- Verified in-browser (not just `npm run verify`): posted a note on a project,
  edited a package price and confirmed it updates the Settings list and shows a
  success toast, clicked through all tab bars post-fix, and let the Analytics
  charts finish their entrance animation to confirm they actually draw (a first
  screenshot right after navigation can look empty — Recharts animates in over
  ~1.5s, that's expected, not a bug).
- Verified 11 Aug: 0 TypeScript errors, 0 lint errors (2 pre-existing unused-var
  warnings on `dashboard/projects/page.tsx` left in place, same as before —
  not touched this session), `next build` succeeds, vitest passes.

## Next, in order

1. Stripe UI, once the webhook side is real (backend now has
   `/api/auth/login` and `/api/projects/[id]` — first real endpoints have
   started landing).
2. Convert one screen off mock data end to end once a GET endpoint exists for
   it, before converting any others.
3. Client detail affordance on the Clients table is still just a resend-invite
   action — worth revisiting once the client list needs more than that.

Design rules in AGENTS.md §5 are non-negotiable: Inter (400/500/600 only),
`#5AB2FF` as the sole UI accent, hairline borders, 4px spacing grid, badges and
cards used sparingly. Not a default shadcn-template look.

## Yours to touch

`app/(marketing)/`, `app/(dashboard)/`, `components/`, `lib/`.
Nothing in `prisma/`, `app/api/` or `mobile/`.
