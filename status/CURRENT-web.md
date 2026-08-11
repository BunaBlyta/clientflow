# CURRENT — web lane

**Owner: the web agent. You are the only writer of this file. Overwrite it before
you stop. Do not edit the other CURRENT-*.md files.**

Last updated: 2026-08-11 by Claude (Cowork)

## State

- **5 routes exist, all on mock data:** `/`, `/dashboard`, `/dashboard/clients`,
  `/dashboard/projects`, `/dashboard/invoices`.
- Built: marketing site (hero, packages/request, process, mobile section, contact
  form, nav, footer), dashboard shell (sidebar, topbar, stat tiles, revenue charts),
  the three list pages, a create-invoice dialog and an invoice row-actions menu.
- **Not built:** product/detail page, settings, notifications, the whole Stripe flow.
- Data comes from `lib/mock-data.ts` via a Zustand store in `lib/store.ts`.
  A second, duplicate `lib/mock-data/` folder was deleted on 10 Aug — nothing
  imported it, and having both made `@/lib/mock-data` resolve by accident.
- Verified 11 Aug: 0 TypeScript errors, 0 lint errors, `next build` succeeds.

## Review before building on it

The clients/projects/invoices pages were written by a session that never committed
or logged anything, so nobody has reviewed the assumptions behind them. They
compile, which is not the same as being right. Two unused imports
(`PROJECT_STATUS_LABEL`, `PROJECT_STATUS_TONE`) were left in place deliberately —
they look like the start of unfinished work.

## Next, in order

1. Wait for the backend's first real endpoint, then convert **one** screen off mock
   data end to end before converting any others.
2. Product/detail page, then settings, then notifications.
3. Stripe UI last, once the webhook side is real.

Design rules in AGENTS.md §5 are non-negotiable: Inter (400/500/600 only),
`#5AB2FF` as the sole UI accent, hairline borders, 4px spacing grid, badges and
cards used sparingly. Not a default shadcn-template look.

## Yours to touch

`app/(marketing)/`, `app/(dashboard)/`, `components/`, `lib/`.
Nothing in `prisma/`, `app/api/` or `mobile/`.
