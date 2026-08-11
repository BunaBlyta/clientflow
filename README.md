# Clientflow

A client and project management CRM for a small web design/development studio.

- **Web** (Next.js) — a public marketing site plus a staff dashboard, and the API both frontends call.
- **Mobile** (`mobile/`, Expo) — the client-facing app: track project status, read notes, pay invoices.

Built as an internship evaluation project for Tetbit.

## Working on this

**Agents: read `AGENTS.md` first — it is the source of truth. Then `STATUS.md` and
the `status/CURRENT-*.md` file for your lane.** Paste-able starting prompts are in
`PROMPT.md`. Ignore `SETUP_GUIDE.md`; it is kept for history and its worktree
advice is actively wrong.

Work happens in this one checkout, directly on `main`. No worktrees, no feature
branches — see `AGENTS.md` §7 for why.

## Running it

```bash
npm install
npx prisma generate
npm run dev          # http://localhost:3000
```

The mobile app is a separate project and needs Node 22:

```bash
cd mobile
nvm use 22
npm install
npx expo start       # press w for browser, or scan with Expo Go
```

Demo login (mock data): `jordan@riversidecoffee.com` / `riverside123`, code `123456`.

## Before you commit

```bash
npm run verify       # tsc --noEmit && eslint . && next build
```

Mobile work also needs `npx tsc --noEmit` from inside `mobile/`.

Commit your own paths — never `git add -A`, since more than one agent may be
working in this folder. Then push.

## Layout

```
app/(marketing)      public site
app/(dashboard)      staff dashboard
app/api              API routes (not built yet)
components/          shared UI
lib/                 helpers, mock data, Zustand store
prisma/              schema + migrations
mobile/              the Expo app (its own package.json)
docs/SPEC.md         what to build
docs/ARCHITECTURE.md why it is built that way
status/              current state per lane + the session log
```
