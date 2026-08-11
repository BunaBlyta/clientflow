# ARCHITECTURE.md

Living document. Update it in the same commit/session that changes the structure — stale architecture docs are worse than none, because agents will trust it.

## System overview

Two frontends, one backend, one database. The Next.js web app serves the public marketing site and the staff dashboard, and also hosts the API routes that both the web app and the separate Expo mobile app call — the mobile app has no direct database access, it only talks to the API. Neon Postgres via Prisma underneath everything. Stripe (sandbox) handles payments, with the single rule that money-related state only ever changes on a confirmed, signature-verified webhook, never on a client-side click. Resend sends transactional email (verification codes, invites, approval notifications). See `AGENTS.md` section 4 for the full entity list.

## Key decisions log

| Decision | Why | Date |
|----------|-----|------|
| Single-tenant, not a multi-tenant SaaS other agencies sign up for | Multi-tenancy's real risk is a data-isolation bug leaking one org's data into another's — exactly the kind of bug that would undercut "functionality," one of the two things this build can't be weak on. Given only one studio actually uses this app, that entire risk class is unnecessary. The Stripe purchasing flow still has a real home either way: the client, not the studio, is the one paying. | 2026-08-10 |
| Payment-confirmed state changes are webhook-driven, never triggered by the client clicking "Pay" | A click doesn't mean payment succeeded — it could fail, get abandoned, or the browser could close mid-flow. A project or invoice only advances on a confirmed Stripe webhook event, which is the only source of truth Stripe actually guarantees. | 2026-08-10 |
| File upload/storage cut entirely from v1 | Not in the mentor's actual requirement list — it was added unprompted while building an early visual mockup, then caught and questioned. Adds a real storage dependency (Vercel Blob, upload handling, size/type limits) for a feature nobody asked for. The shared note feed carries written updates instead. | 2026-08-10 |
| Mobile app (Expo) is scoped to the client experience only, not a mirror of the full staff dashboard | Dense data tables and analytics charts aren't comfortable on a phone, and building full feature parity across two platforms wasn't achievable in a 4-day window. The client side is the part that genuinely benefits from being native (push notifications, checking status on the go); staff keep the web dashboard. | 2026-08-10 |
| Clients are never self-registered — accounts only activate via an approved request or manual staff creation | Keeps a human checkpoint before an account (and eventually money) exists, and matches how the custom-package flow already works. | 2026-08-10 |
| Standard-package signup is "submit a request → staff approves → then pay," not instant-charge-on-registration | An earlier version charged a deposit immediately on registration. Flagged directly as unrealistic — real service businesses don't take payment before any human review of the request. Revised to insert an approval step before money moves, while keeping the payment itself client-initiated. | 2026-08-10 |
| Mid-project change requests use the shared note feed plus a normal extra invoice, not a formal request/approve/re-price/re-approve workflow | The full version is a second workflow layered on everything else — real scope for a 4-day build. The lightweight version keeps the same protection that actually matters (client can see the charge, its amount, and its status) without the extra system. | 2026-08-10 |
| No staff permission tiers (admin/PM/designer/finance) — every staff account has equal permissions | Deliberate scope cut given the deadline. Considered and explicitly rejected during planning as a place to spend limited time. | 2026-08-10 |
| Icon library is Lucide, not Hugeicons | Lucide was an explicit requirement in the mentor's assigned tech stack. A colleague's Hugeicons (stroke-rounded) recommendation was considered, but deviating from an assigned stack item in an evaluation meant to prove you can follow a brief was judged not worth it. | 2026-08-10 |
| Codex CLI owns the backend (schema, API, Stripe/webhooks, auth logic, seed script); Claude Code owns all frontend on both platforms (web + mobile), parallelized via subagents | Matches the user's stated tool preference and gives each agent clean, non-overlapping file ownership — Codex touches `prisma/` and API routes only, Claude Code touches frontend directories only. | 2026-08-10 |
| Stateless signed auth token, returned in JSON and set as an HTTP-only cookie | Web can use the secure cookie while Expo can store the same token and send it as `Authorization: Bearer <token>`, without adding a session table or making mobile cookie handling a dependency. | 2026-08-11 |
| API dates are serialized as ISO 8601 strings and project responses keep top-level IDs while adding only the package summary needed by consuming screens | Both frontend type files expect string dates and project IDs; `packageId` remains top-level for compatibility, while the related package's name, price, and currency avoid a second lookup on project detail screens. | 2026-08-11 |
| Design language pulls specifically from Linear, Attio, and Stripe | The user responded strongly to all three, and they share a describable philosophy (restraint, typography-led hierarchy, status communicated through layout rather than pill badges, dense-but-readable tables) that directly serves "premium, not a generic AI-template look" — see AGENTS.md section 5 for the full translation into typography/color/spacing rules. | 2026-08-10 |

Keep this log even for decisions that seem obvious at the time — it's what stops an agent (or you, in three weeks) from "fixing" something that was deliberate.

## First API contracts

`POST /api/auth/login` accepts `{ "email": string, "password": string }` and
returns `{ user, token }`. `user` has the web frontend's current shape:

```json
{
  "id": "staff-1",
  "email": "sam@clientflow.studio",
  "name": "Sam Torres",
  "role": "STAFF",
  "createdAt": "2026-08-01T09:00:00.000Z"
}
```

The token is also set as the `clientflow_session` HTTP-only cookie. Mobile stores
the response token and sends it as `Authorization: Bearer <token>`; the backend
accepts either the bearer token or cookie.

`SESSION_SECRET` is required in Vercel before deployment. Production fails at
module load if it is missing; local development may use the explicitly named
development-only fallback with a warning.

`GET /api/packages` is public and returns active packages ordered by `sortOrder`:

```json
[
  {
    "id": "pkg-full-website",
    "name": "Full Website",
    "slug": "full-website",
    "description": "A complete multi-page marketing site.",
    "price": 6500,
    "currency": "usd",
    "estimatedDuration": "6–8 weeks",
    "sortOrder": 2
  }
]
```

`price` is serialized as a JSON number in major currency units rather than
returning Prisma's `Decimal` object. `estimatedDuration` is nullable and is
returned as `null` when a package has no estimate.

`GET /api/projects` and `GET /api/projects/:id` require a session and retain
their existing top-level project fields, including `packageId`, while adding
the related package summary when one exists:

```json
{
  "id": "proj-1",
  "clientId": "client-1",
  "packageId": "pkg-full-website",
  "package": {
    "id": "pkg-full-website",
    "name": "Full Website",
    "price": 6500,
    "currency": "usd"
  },
  "name": "Riverside Cafe — Full Website",
  "status": "DEVELOPMENT",
  "createdAt": "2026-06-02T14:00:00.000Z",
  "updatedAt": "2026-08-05T09:30:00.000Z",
  "targetLaunchDate": "2026-09-15T00:00:00.000Z"
}
```

`packageId` is intentionally `string | null` in the live database contract so
custom projects can omit a package; the additive `package` response field is
`null` in that case. `description`, `startedAt`, `launchedAt`, and other Prisma
relations are not returned until a consuming screen needs them.

`GET /api/invoices` requires the same session and returns a flat array ordered
newest first. `GET /api/invoices/:id` returns one invoice or 404. Staff can see
all invoices; client sessions are restricted to invoices belonging to their
client, and an invoice belonging to another client is deliberately reported as
404 rather than 403 so its existence is not disclosed.

```json
{
  "id": "inv-1",
  "projectId": "proj-1",
  "clientId": "client-1",
  "kind": "DEPOSIT",
  "label": "Deposit — Full Website",
  "amountCents": 325000,
  "status": "PAID",
  "dueDate": "2026-06-10T00:00:00.000Z",
  "paidAt": "2026-06-03T08:20:00.000Z",
  "createdAt": "2026-06-02T14:10:00.000Z"
}
```

The API calls the Prisma `type` field `kind`, converts the database amount
from major currency units to integer cents, and supplies a label based on the
invoice kind if `description` is null. Nullable dates are omitted. `CUSTOM` is
returned as its own kind so each frontend can widen its local invoice union.

## Table action write contracts

`PATCH /api/invoices/:id` is staff-only and accepts:

```json
{ "status": "PAYMENT_PENDING" }
```

It returns the same serialized invoice object as `GET /api/invoices/:id`.
Invalid status values return 400, missing invoices return 404, client sessions
return 403, and illegal transitions return 409 with an error naming both states.
Manual updates cannot target `PAID` or `REFUNDED`: Stripe's verified webhook is
the only payment confirmation path, and refunds are intentionally out of scope.

`PATCH /api/projects/:id` is also staff-only and accepts:

```json
{ "status": "DEVELOPMENT" }
```

It returns the same flat project object as `GET /api/projects/:id`. Valid
statuses are the Prisma `ProjectStatus` values (`PENDING`, `DISCOVERY`,
`DESIGN`, `DEVELOPMENT`, `REVIEW`, `LAUNCHED`, `CANCELLED`, and `ON_HOLD`).
Each changed status creates an immutable system note such as `Project status changed
from Design to Development.` in the same database transaction as the project
update. Invalid status values return 400, missing projects return 404, and
client sessions return 403.
