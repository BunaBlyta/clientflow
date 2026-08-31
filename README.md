# Clientflow

A client and project management CRM for a small web design/development studio. Staff run their business from a web dashboard — clients, projects, invoices, analytics — and the studio's clients get a native mobile app to track project status, stay in the loop, and pay.

Built as my internship project at Tetbit, a software/design/growth agency in Kosovo. I own the React Native mobile app and the Next.js staff dashboard end to end, including the shared backend API and database both of them run on.

**Live:** [clientflow-ijdn.vercel.app](https://clientflow-ijdn.vercel.app/)

## What it does

Two roles, one system:

- **Staff** manage clients, projects, and invoices from a web dashboard: a request queue for new work, per-project status tracking (Pending → Discovery → Design → Development → Review → Launched), invoice creation and history, and revenue/turnaround analytics with real charts.
- **Clients** use the mobile app to request work, follow their project's progress on a stage tracker, read and post notes on a shared activity feed, and pay invoices.

Other things it handles:

- Full auth for both roles, including email verification codes and forgot-password, sent through Resend.
- A real, webhook-driven Stripe integration (sandbox) — a project or invoice only moves to a paid state on a signature-verified, idempotent Stripe webhook event, never on the client just clicking "Pay." Tested against both a successful and a declined card, and against duplicate webhook delivery.
- A shared, immutable note feed per project, with every status change logged into it automatically as an audit trail.
- An AI-generated analytics summary (via Groq) that turns the dashboard's revenue/turnaround numbers into a short plain-English insight.
- Push and in-app notifications for status changes, new invoices, and payments.

## Demo

```
jordan@riversidecoffee.com / riverside123
verification code: 123456
```

Mock data — feel free to poke around.

## Tech stack

**Web:** Next.js (App Router), React, TypeScript, Tailwind CSS v4, shadcn/ui, Zustand, Recharts

**Mobile:** React Native, Expo, TypeScript, Expo Router, Zustand

**Backend:** Prisma ORM, Neon (Postgres), Stripe, Resend, Groq

**Deploy:** Vercel

## Architecture

Two frontends, one backend, one database. The Next.js app serves the public marketing site and the staff dashboard, and also hosts the API routes that both the web app and the Expo mobile app call — the mobile app has no direct database access, it only talks to the API.

```
app/(marketing)   public site
app/(dashboard)   staff dashboard
app/api           backend API, shared by web and mobile
components/       shared UI
lib/              helpers, state, Zustand store
prisma/           schema and migrations
mobile/           the Expo app (its own package.json)
docs/             feature spec and architecture notes
```

## Design

Not a default component-library look. White base with a single soft blue accent (`#5AB2FF`), Figtree throughout, a 4px spacing grid, hairline borders used only where they earn their place, and status communicated through layout and color rather than a badge on every row. Reference points were Linear, Attio, and Stripe's marketing pages.

## Running it locally

Web:

```bash
npm install
npx prisma generate
npm run dev          # http://localhost:3000
```

Mobile (needs Node 22):

```bash
cd mobile
nvm use 22
npm install
npx expo start        # press w for web, or scan with Expo Go
```

Before committing:

```bash
npm run verify        # typecheck, lint, and build
```

## Notes

This is a portfolio/evaluation build, not a production product: no multi-tenant support, no real customer data, no production secrets. See [`docs/SPEC.md`](docs/SPEC.md) for the full feature scope and [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the deeper technical decisions behind it.
