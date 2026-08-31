### 2026-08-10 22:30 — Claude (Cowork) — recovered and merged all the scattered work

**Read this entry before doing anything else. The layout of the project changed.**

Changed:
- **Committed everything. Nothing was committed before this.** Roughly 7,800 lines
  of finished work — the whole web frontend, the whole mobile app, and the database
  schema — were sitting as uncommitted changes in three different folders. Any one
  of the usual accidents (a bad `git checkout`, a cleanup script, a discarded
  worktree) would have destroyed days of work permanently. Each lane's work is now
  a real commit on its own branch, so it can always be recovered.
- **Merged the three lanes into `main`.** `main` now has the marketing site, the
  staff dashboard, the mobile app, and the Prisma schema all together, and it
  builds. Before this, no single branch had more than a third of the project.
- **Pointed all four worktrees at the same commit**, so `main`, `backend`,
  `frontend` and the nested agent worktree now start from identical, complete
  state instead of three partial views that each thought they were the project.
- **Deleted `lib/mock-data/`** (the folder, not the file). Two different agents
  had each built their own mock data — a `lib/mock-data/` folder on `main` and a
  `lib/mock-data.ts` file on `frontend`. Nothing imported the folder version. With
  both present, `import ... from "@/lib/mock-data"` is ambiguous and resolves by
  accident, which is a real bug. The file version is the one the actual screens
  use, so the folder went.
- **Fixed two things that were quietly broken:** `prisma.config.ts` set a
  `directUrl` option Prisma 7 does not accept there (broke the typecheck), and the
  web linter was scanning the Expo app and demanding apostrophes inside React
  Native `<Text>` become HTML entities like `&apos;` — React Native does not decode
  those, so obeying it would have printed the entity on screen. Mobile is now
  excluded from the web lint config, as it is a separate project per AGENTS.md §3.
- Added a safety tag, `pre-consolidation-backup`, marking `main` as it was before
  any of this. `git reset --hard pre-consolidation-backup` undoes the whole merge.

Tried and abandoned (what didn't work, and why):
- Tried resolving the merge by hand file by file. Wrong approach — the two sides
  had 13 overlapping files, mostly the same shadcn components generated twice at
  different times. Checked which side the working screens actually import from,
  found `frontend` was the genuine superset (newer components, plus recharts /
  zustand / sonner / next-themes / date-fns that its screens need), and took that
  side wholesale instead of merging line by line. Faster and less error-prone.
- Tried verifying the merge in a scratch clone with `node_modules` symlinked in to
  avoid a reinstall. Turbopack rejects a symlinked `node_modules` outright
  ("points out of the filesystem root"). Verified in the real checkout instead.
- Could not run `prisma generate` or `prisma migrate` — this sandbox is blocked
  from reaching `binaries.prisma.sh` and Neon. Same blocker Codex hit twice in the
  entries below; it is the sandbox, not the code or the credentials. **This still
  needs to be run on a real machine with network access.**
- `next build` also cannot fetch Inter from Google Fonts in this sandbox. Confirmed
  this is the *only* thing stopping the build by temporarily stubbing the font,
  building successfully, then restoring `app/layout.tsx` byte-for-byte.

Left for next session:
- **Run `npm install` in `clientflow/` before anything else.** The merge brought in
  new dependencies. It has been run once already here, but any other checkout
  (`clientflow-backend`, `clientflow-frontend`) still has stale `node_modules`.
- **Run `npx prisma generate`, then the initial migration.** This is now the single
  biggest blocker to progress: the schema exists but no database tables do, so no
  API route can be written or tested yet. Everything the frontends show is mock data.
- **There is still no seed script and no API routes.** Five web routes now exist:
  `/`, `/dashboard`, `/dashboard/clients`, `/dashboard/projects`,
  `/dashboard/invoices`. Still not built on web: the product/detail page, settings,
  notifications, and the Stripe flow.
- **Review the clients/projects/invoices dashboard pages before building on them.**
  They appeared uncommitted in the web worktree partway through this consolidation
  and were committed as `feat(web): staff dashboard clients, projects and invoices
  pages`. They typecheck, lint and build cleanly, but the session that wrote them
  never logged an entry here, so its assumptions are unrecorded and unreviewed.
  Two unused imports (`PROJECT_STATUS_LABEL`, `PROJECT_STATUS_TONE`) are left in
  place deliberately — they look like the start of unfinished work, so they were
  not "cleaned up" in case that removes a hint about intent.
- Decide whether to keep three separate worktree folders at all. Everything is
  merged and identical now, so working directly in `clientflow/` on `main` is
  simpler and is what caused none of this week's problems. See the note below.
- `../tetbit-app` is a dead duplicate — planning docs only, no code, nothing
  unique. Left in place with a `READ_THIS_FIRST.md`; safe to delete.

Assumptions made (flag if wrong):
- Assumed `frontend` should win on every file both it and `main` touched, and that
  the mobile branch should win on everything under `mobile/`. Based on reading which
  files the working code imports, not on guessing. If a component looks like it lost
  a change you made, that change is still in git history on the original branch.
- Assumed removing `directUrl` is correct rather than moving it elsewhere. If Neon's
  pooled connection causes trouble during migrations, point `DATABASE_URL` at the
  direct Neon URL for the migration command instead of re-adding `directUrl`.
- Used `Buna <bunablyta@gmail.com>` as the commit author, since no git identity was
  configured anywhere. Worth setting `git config --global user.name/user.email`.

Blockers:
- None in the code. Verified after merging: **0 TypeScript errors, 0 lint errors,
  and `next build` completes and prerenders `/` and `/dashboard`.** The remaining
  blockers are the database migration and the two network calls above, all of which
  need a real machine rather than this sandbox.

**Why the mess happened, so it doesn't happen again:** the folder connected to
Claude was `tetbit-app`, but the actual code was in `clientflow` — a sibling
folder Claude could not see. So sessions kept re-deriving state, and each agent
worked in its own worktree without ever committing, because no session had a full
enough view to feel safe committing. The fix was connecting the parent `tetbit`
folder instead of a single subfolder. **Keep the connected folder at
`/Users/buna/Documents/tetbit` so every agent can see all of it.**

---
