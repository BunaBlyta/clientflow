# AGENTS.md

This is the single source of truth for anyone (or anything) working in this repo — you, Claude Code, and Codex CLI. Claude Code reads this file via the `@AGENTS.md` import in `CLAUDE.md`. Codex CLI reads it natively. Keep it updated here, never fork the content into a second file.

## 1. What this project is

- **One-liner:** Clientflow (working name, easy to swap) — a client and project management CRM for a small web design/development studio: a public marketing site with a staff dashboard on web, and a native mobile app for the studio's clients.
- **Who it's for:** Two roles. Staff (the studio) use the web dashboard to manage clients, projects, and invoices. Clients (businesses who hired the studio) use the React Native/Expo mobile app to request work, track project status, and pay.
- **Why it exists / what problem it solves:** This is an internship evaluation project for Tetbit (a software/design/growth agency). The mentor assigned a specific feature list (landing page, auth with email verification codes, dashboard, tables, table actions, a product/detail page, analytics, settings, notifications, Stripe payments and pricing, bonus AI) and left the concept open. This app was chosen because it mirrors what Tetbit actually builds for clients — a consumer/client-facing surface plus an internal CRM/ops dashboard (the same shape as their own two.jobs, Fajnd, and CreaClean products) — and because every required feature has a real, non-forced home in it. The goal is to prove production-quality delivery under a hard deadline, not to explore an open-ended idea.
- **Not building (v1):** See "Explicitly out of scope" in `/docs/SPEC.md` for the full list. Headline exclusions: a formal change-request/re-pricing approval workflow, refund automation, multiple staff permission tiers, multi-tenant support (multiple agencies), real-time messaging, file upload/storage, recurring/subscription billing, and data export/account deletion flows.

## 2. Constraints

- **Deadline / time budget:** Hard deadline is Friday, August 14, 2026 (this project kicked off Monday, August 10 — four working days). Deployed and clickable end to end by Friday. The user is working on this as their actual job during 8-5 at the office, with evenings at home as extra runway — agents should move as aggressively as possible, but should finish the must-have list with enough buffer for the user to personally test everything before Friday, not race to the wire.
- **Must-use tech (assigned by the mentor, not open to substitution):** Next.js (App Router), React, TypeScript, Tailwind CSS v4, shadcn/ui, Lucide icons, Prisma, Neon (Postgres), deploy to Vercel, React Native + Expo for the mobile app.
- **Must-use tech (decided during planning):** Zustand for state management, Vitest + Playwright for testing, Stripe (sandbox) for payments, Resend for transactional email (verification codes, invites), the Anthropic API for the AI analytics feature — all chosen because they're standard, well-documented fits for this stack with no licensing friction.
- **Non-negotiables:**
  1. Design must be premium and considered throughout — see the Design Direction section below. Not a generic AI-template look.
  2. The full must-have feature list works end to end (see `/docs/SPEC.md`).
  3. The Stripe purchasing flow is real and webhook-driven — a project or invoice only advances to a paid state on a confirmed Stripe webhook event, never on the client clicking "Pay" alone.

## 3. Stack & conventions

- **Language(s) / framework(s):** TypeScript everywhere. Web: Next.js App Router + React + Tailwind v4 + shadcn/ui. Backend: Prisma ORM against Neon Postgres, API routes/route handlers inside the Next.js app. Mobile: Expo (React Native) + TypeScript + NativeWind, consuming the same backend API.
- **Package manager:** npm, in both the web/backend project and the separate Expo project. Kept as two independent projects (not a monorepo) to avoid adding workspace tooling overhead under a 4-day deadline.
- **Formatting / linting:** ESLint (Next.js default config) + Prettier in both projects. Run before committing — a task isn't done if lint fails.
- **Testing:** Vitest for unit/logic tests (especially the Stripe webhook handler, invoice state transitions, and request-approval logic — anything financial or state-machine-shaped needs a real test, not just a manual click-through). Playwright for end-to-end flows on web (the three core flows in `/docs/SPEC.md`). No task is done with failing tests, and no invoice/payment logic ships without a test covering it.
  - **Status as of 2026-08-11: neither Vitest nor Playwright is installed, and there are zero test files.** So this rule currently cannot be followed. Do not silently ignore it, and do not stop mid-feature to build out test infrastructure either. The backend lane installs Vitest as its own task **before** starting Stripe or invoice logic — that is the point where an untested bug means wrong money rather than a wrong pixel. Until then, `npm run verify` (typecheck + lint + build) is the actual enforced gate.
- **Commit style:** Conventional Commits (`feat:`, `fix:`, `chore:`, etc.) — low overhead, keeps history readable for a reviewer skimming it.
- **File/folder conventions:** Standard Next.js App Router layout — route groups for `(marketing)` (public landing/pricing/contact) and `(dashboard)` (staff, behind auth), shared UI in `components/`, utilities in `lib/`, schema and seed script in `prisma/`. The Expo app lives in its own top-level folder (e.g. `mobile/`) as a separate project.

## 4. Architecture

Two frontends, one backend, one database. The Next.js web app serves the public marketing site and the staff dashboard, and also hosts the API routes both the web app and the mobile app call. The Expo app is a separate project that talks to the same API over HTTP — it has no direct database access.

- **Entry points:** Web — `app/(marketing)` for the public site, `app/(dashboard)` for staff (behind login), `app/api/*` for the backend API. Mobile — the Expo app's own entry point, calling the same `app/api/*` routes.
- **Data model / storage:** Neon Postgres via Prisma. Core entities: `User` (role: staff or client — staff self-register once and invite teammates after; clients are never self-registered, only created via an approved request or manually by staff for custom work), `Client`, `Package` (the three service tiers, editable in staff Settings — single source of truth for both the public pricing page and internal project creation), `ProjectRequest` (a prospect's standard-package request, status Pending/Approved/Rejected — separate from `Client` so a rejected request never touches real client data), `ContactLead` (a custom-package inquiry, minimal — name/email/message, no pipeline), `Project` (status: Pending → Discovery → Design → Development → Review → Launched, or Cancelled/On Hold — status can move in any direction, staff-driven, except the one payment-gated transition below), `Invoice` (status: Draft → Sent → Payment Pending → Paid → Failed / Voided / Refunded), `Note` (one shared, immutable activity feed per project — both staff and client post to it; system-generated entries log every status change, which is also the audit trail), `Notification` (per user).
- **Key modules and what they own:** The only automated, payment-gated status transition is Approved → Discovery, which fires on a confirmed Stripe webhook for the deposit invoice — every other project status change is a manual staff action. Extra/change-request invoices reuse the same `Invoice` entity and status lifecycle as the deposit and final invoices — there is no separate change-approval system. Files are explicitly not part of this app (see out of scope).
- **External services / APIs:** Stripe (sandbox) for payments — webhook handling must be idempotent and signature-verified, this is the one piece of financial-correctness plumbing that has to be right. Resend for transactional email (verification codes, request-approval notifications, staff invites). Anthropic API for the AI analytics insight (nice-to-have tier — a short plain-English summary generated from already-computed dashboard numbers, read-only, no natural-language query/filtering).

See `/docs/ARCHITECTURE.md` for anything too long to keep here — in particular, the decision log is worth filling in given how many "why" decisions were made during planning (single-tenant over multi-tenant, webhook-driven payment state, no file uploads, etc.), so a future session doesn't second-guess something that was deliberate.

## 5. Design direction

This is a non-negotiable, not a nice-to-have — the bar is premium and considered, not a generic AI-generated template look. Follow this specifically:

- **Typography:** Inter throughout, both platforms. Weights 400 (body/table text), 500 (emphasis — active nav, button labels, the current step in a progress tracker), 600 (headings only) — nothing heavier. Sizes: 12-13px muted/meta text, 13-14px body and table content, 15-16px card titles, 20-22px page headings, 28-32px landing page hero only.
- **Color:** White base. `#CAF4FF` and `#A0DEFF` as soft accents on the public landing page only (section backgrounds, gradient moments). `#5AB2FF` as the single UI accent everywhere else (dashboard and mobile) — buttons, links, active states, the current step in a tracker. Status badges (Paid/Due/Overdue, project stages) use standard semantic colors (green/amber/red), kept separate from this brand palette so they stay scannable at a glance.
- **Borders:** 1px hairline, light gray, never black, used only where separation is actually needed (under table rows, around a card that needs to stand apart). One deliberate exception: a 2px accent border on a "most popular" pricing card. No other heavy borders anywhere.
- **Spacing:** 4px grid only — 4/8/12/16/24/32px, no arbitrary values. Sidebar ~200-220px wide. Content padding 16-24px. Cards padded 16-20px internally.
- **Composition:** Left-aligned text except the landing hero. Numbers right-aligned in tables, everything else left-aligned, consistent column alignment. Content width-constrained on large screens, not edge-to-edge.
- **Badges and cards, used sparingly:** Badges only where status genuinely needs a scannable flag (invoice state, project stage) — not the default treatment for every label. Cards only where something needs real visual separation (like standalone metric numbers) — group related content with typography and whitespace first; don't wrap everything in a bordered box by default. Status should often be readable from layout and position alone, the way a well-built CRM table does it, not from a pill badge on every row.
- **Animation:** Fast and subtle only. Hover/press states 100-150ms. Panel/modal entrances 200-250ms, ease-out, a small fade plus slide — nothing more elaborate. No parallax, no bounce, no page-transition showcases. If Framer Motion is used at all, it's for micro-interactions like this, not a feature in itself.
- **Icons:** Lucide (`lucide-react` on web, `lucide-react-native` on mobile) — this was an explicit mentor requirement, confirmed over an alternative (Hugeicons) during planning.
- **Reference language, for both agents:** Linear (extreme restraint, dense-but-clean lists, status via text/color rather than badges, `#08090A` dark theme if dark mode is built), Attio (CRM-specific composition — table and pipeline-card patterns that communicate status through layout, not decoration), Stripe (bento-grid feature layouts and large stat callouts with no card wrapper, used on the landing page specifically). Avoid the default shadcn-template look — every element should read as a deliberate choice.

## 6. Priority order (this is what "done" is measured against)

**Must-have, non-negotiable, build and polish these first:** design (see above), full auth including forgot-password and email verification codes, the Stripe purchasing flow, dashboards and analytics with real charts, table actions, the mobile app.

**Nice-to-have, attempt only once every must-have is solid, in this order:** 1) dark/light theme, 2) SEO metadata and sitemap, 3) the AI analytics insight blurb, 4) multi-language support (next-intl).

**Explicitly out of scope — see `/docs/SPEC.md` for the full list and reasoning.**

If time runs short, the cut happens at the bottom of the nice-to-have list, in order — that decision is already made, it doesn't need to be re-litigated mid-week.

## 7. Working agreement (for any agent touching this repo)

**The two rules below are hard requirements, not guidance. Everything else in this section is secondary to them.**

- **RULE 1 — Commit at the end of every task. No exceptions.** Uncommitted work is invisible to every other lane and every other session. On 2026-08-10 roughly 7,800 lines — a complete mobile app and most of the web dashboard — sat uncommitted across four folders and came close to being lost. If you finish a task and have not committed, the task is not finished. Never leave a session with a dirty tree.
- **RULE 2 — Before you stop, overwrite your own lane's state file and add a log entry.** Your lane's file is `status/CURRENT-api.md`, `status/CURRENT-web.md` or `status/CURRENT-mobile.md`. **Write only your own — never another lane's, and never `STATUS.md`, which Buna owns.** Then create a *new* file at `status/log/YYYY-MM-DD-HHMM-agent-task.md`; never edit an existing log file. Every file has exactly one writer, so collisions are structurally impossible — do not break that by editing someone else's. If your state file is stale, the next session starts blind and re-derives the state badly, which is exactly how the 10 August mess happened.

- **Before starting a task:** read this file, then `STATUS.md` and the three `status/CURRENT-*.md` files. Together they are the source of truth for the project's current state — trust them over anything you remember or infer from the code. Read `status/log/` only if something looks wrong or you need the "why" behind a past decision. Don't assume — if the task is ambiguous, state your interpretation before writing code, don't just guess and proceed silently.
- **CURRENT SETUP, from 2026-08-11: three Codex agents, split by DIRECTORY.** The boundaries are chosen so two agents physically cannot open the same file. Read only your own `status/CURRENT-*.md`.

  | Agent | Lane | Owns | State file |
  |---|---|---|---|
  | **A** | API & database | `app/api/**`, `prisma/`, `docs/ARCHITECTURE.md` | `status/CURRENT-api.md` |
  | **B** | Web UI | `app/(marketing)/`, `app/(dashboard)/`, `app/(auth)/`, `middleware.ts`, `app/globals.css`, `components/`, `lib/` | `status/CURRENT-web.md` |
  | **C** | Mobile | `mobile/**` and nothing else | `status/CURRENT-mobile.md` |

  A feature split was tried briefly on 11 Aug and reverted: auth, Stripe and data-wiring verticals all needed `app/api/`, `lib/` and `mobile/`, so they would have collided *and* blocked each other. A directory split has no overlap by construction, and ran a full day with zero real collisions.

- **BUNA RUNS MIGRATIONS AND INSTALLS, NOT YOU.** Never run `prisma migrate`, `npm install`, or `npx expo install`. Print the exact command, say why, and stop. Concurrent migrations corrupt migration history against a live Neon database; concurrent installs corrupt the lockfile. These are the only two failures in this setup that are silent and genuinely painful to undo — everything else fails loudly and is recoverable from git.
- **The seam between lanes is the API contract, not files.** Agent A produces routes; B and C consume them. When A adds or changes a response shape, it records it in `docs/ARCHITECTURE.md`. B and C read that rather than guessing. `lib/types.ts` belongs to B, `mobile/lib/types.ts` belongs to C — A proposes changes through Buna.
- **`npm run verify` will sometimes fail on another agent's half-written file.** Expected with three agents in one checkout. Re-run it. If it still fails, check whether the failing file is one you own — if it is not, do not fix it, report it.
- **Never `git add -A`.** Commit your own paths explicitly, including your own `status/CURRENT-*.md`. Commit small and often: short-lived changes make the rare overlap trivial instead of a merge.
- **Ownership split (original description, superseded by the table above):** Codex CLI owns the backend — the Prisma schema (defined first, once, sequentially, before anything else fans out, since every other lane depends on it), API routes, the Stripe integration and webhook handler, auth logic, and the database seed script (mock clients/projects/invoices across a spread of statuses, so the dashboard and analytics have real data to show from the first login — an empty dashboard doesn't demonstrate anything). Claude Code owns all frontend on both platforms — the web landing/marketing page, the web staff dashboard, and the mobile app — and can spawn subagents to run these as parallel lanes, since they're separate codebases/route trees with no file overlap. Once the schema is locked, further fan-out is fine on both sides (e.g. separate backend lanes for Stripe/invoices vs. requests/notifications vs. analytics aggregation) as long as lanes don't touch the same files.
- **Sequencing:** Claude Code doesn't have to wait for the full backend — it can build both frontends against mock data first (using the design direction above as the visual spec), then wire up real API calls screen by screen as Codex CLI's endpoints come online. First priority once the schema exists: one thin slice working end to end (e.g. login → see a seeded project → see its status) before either side goes further.
- **Isolation — read this, it changed on 2026-08-11.** Everyone works in the single `clientflow/` checkout, directly on `main`. **Do not create git worktrees or feature branches.** We tried worktrees and removed them: they gave each lane its own `node_modules`, which silently drifted out of sync with `package.json` and broke the mobile app, and they cost a merge step per lane for no benefit. Isolation is by *directory ownership* instead, which works because the lanes never touch the same files: Codex CLI touches only `prisma/` and `app/api/`; the web agent touches only `app/(marketing)/`, `app/(dashboard)/`, `components/` and `lib/`; the mobile agent touches only `mobile/`.
- **Commit your own paths, never `git add -A`.** Another lane may have work in progress in the same checkout, and `-A` would sweep it into your commit. Use `git add prisma/ app/api/` (backend), `git add app/ components/ lib/` (web), `git add mobile/` (mobile), plus your own `status/` files. Then `git push` — a local commit still only exists on one machine.
- **Communication standard:** `STATUS.md` entries (and any status pings) must be written in plain language a non-engineer could follow — what changed and why, not unexplained jargon. "Changed how invoices link to projects so a client can't see someone else's charges," not "refactored the Prisma relation to use a composite foreign key." This matters here specifically because the user needs to be able to explain this app confidently, not just have it work.
- **Before ending a session:** see RULE 1 and RULE 2 at the top of this section — commit and push, and update your own `status/CURRENT-*.md` plus a new `status/log/` entry. Do not write to `STATUS.md`; Buna owns it.
- **Autonomy:** the user is comfortable with agents running largely unsupervised, as long as the task is clearly understood against this file and `/docs/SPEC.md` — but the user is actively present and working on this throughout the day (this is their actual work this week, not a side project), so check-ins can and should happen same-day, not just once. Don't guess on anything touching architecture, the data model, or user-facing behavior — surface it in `STATUS.md` instead.
- **Definition of done for any task:** `npm run verify` passes from the repo root (that is `tsc --noEmit && eslint . && next build` chained — it stops at the first failure, so it cannot be half-passed). Mobile work additionally needs `npx tsc --noEmit` from inside `mobile/`. Then: committed and pushed, your own `status/CURRENT-*.md` updated in plain language, a new `status/log/` entry added, and the change matches `/docs/SPEC.md` — not more, not less. **Run the command; do not report success from memory.**
- **Definition of done for the project, Friday:** deployed (web on Vercel, mobile reachable via Expo/EAS), the full must-have list clickable end to end, tests passing, design at the bar set above, and the user has personally tested it with real time set aside — not just watched it happen.
- **When blocked or uncertain:** prefer surfacing the question over guessing on anything that affects architecture, data models, or user-facing behavior. Small implementation details are fine to decide autonomously — just note the decision.

## 8. Current status

See `STATUS.md` for the live log. This section stays static — don't update it per-session.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
