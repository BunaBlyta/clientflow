# ARCHITECTURE.md

Living document. Update it in the same commit/session that changes the structure — stale architecture docs are worse than none, because agents will trust it.

## System overview

Two frontends, one backend, one database. The Next.js web app serves the public marketing site and the staff dashboard, and also hosts the API routes that both the web app and the separate Expo mobile app call — the mobile app has no direct database access, it only talks to the API. Neon Postgres via Prisma underneath everything. Stripe (sandbox) handles payments, with the single rule that money-related state only ever changes on a confirmed, signature-verified webhook, never on a client-side click. Resend sends transactional email (verification codes, invites, approval notifications). See `AGENTS.md` section 4 for the full entity list.

### Analytics insight

`POST /api/analytics/insight` is staff-only and takes no request body. It reads
active packages, projects, and invoices on the server, computes revenue over
time, revenue by package, turnaround by package, project stages, and the
outstanding invoice total with `lib/analytics.ts`, then sends those numbers to
Groq using the `llama-3.3-70b-versatile` model. A successful response is
`{ "insight": string }`; missing configuration, upstream failures, or malformed
model responses return a JSON error so the dashboard can keep its inline failure
state. Groq was chosen for its free tier, no-card setup, and generous limits for
this low-volume, read-only summary.

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
| Custom package inquiries use the existing `ContactLead` record and a staff conversion transaction | A custom prospect needs a lightweight public intake, but the resulting client, package-less project, and one-off invoice must be created together. Keeping the existing schema avoids a migration while the staff list derives converted state from the lead email matching a client. | 2026-08-13 |
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

`POST /api/invoices` is staff-only and accepts `{ "projectId": string,
"type": "DEPOSIT" | "FINAL" | "EXTRA" | "CUSTOM", "amount": number | string,
"currency": string, "dueDate"?: string, "description"?: string }`. Amounts use
the same major currency units accepted by the package API and are stored to two
decimal places. The server derives `clientId` from the project, ignores any
client ID supplied by the caller, and creates every invoice in `DRAFT` through
the invoice state helper. Requests for `PAID` or `PAYMENT_PENDING` are rejected;
Stripe's verified webhook remains the only payment confirmation path.

The successful response is 201 with the exact same serialized invoice shape as
`GET /api/invoices`. Creating an invoice also creates an
`EXTRA_CHARGE_CREATED` notification for the project client in the same database
transaction, so the client is told when a new charge appears.

`POST /api/notes` accepts `{ "projectId": string, "body": string }` for both
staff and client sessions and returns 201 with the same shape as a note from
`GET /api/notes`:

```json
{
  "id": "note-14",
  "projectId": "proj-1",
  "authorId": "user-client-1",
  "authorName": "Jordan Ellis",
  "authorRole": "CLIENT",
  "body": "Could we add a testimonials section?",
  "createdAt": "2026-08-12T10:30:00.000Z"
}
```

The server takes `authorId` from the session and always writes `isSystem: false`;
body-supplied author or system fields are ignored. Clients can only post to a
project whose client belongs to their session; an unknown or other client's
project is returned as 404. A client note creates `NEW_NOTE` notifications for
staff users, while a staff note creates one for the project client. The author
is never notified about their own note, and notes have no update or delete
endpoint.

`PATCH /api/notifications/:id` marks the authenticated user's notification as
read and returns the same object shape as `GET /api/notifications`, with
`body` mapped from the database `message` and `read: true`. The lookup includes
both the notification ID and session user ID, so another user's notification is
reported as 404. Repeating the request for an already-read notification returns
200 without writing again.

## Stripe checkout contracts

`POST /api/stripe/checkout` accepts `{ "invoiceId": string, "returnTo"?:
"mobile" }` for an authenticated owner of the invoice (staff may pay any
invoice). The response shape is unchanged:

```json
{
  "checkoutSessionId": "cs_...",
  "checkoutUrl": "https://checkout.stripe.com/..."
}
```

When `returnTo` is omitted, the Stripe success URL remains the web flow:
`/payment/success?session_id={CHECKOUT_SESSION_ID}`. When `returnTo` is
`"mobile"`, the server builds the fixed success URL with the invoice and
project IDs:
`/payment/success?session_id={CHECKOUT_SESSION_ID}&return_to=mobile&project_id=...&invoice_id=...`.
Other `returnTo` values are rejected with 400; callers never supply an
arbitrary redirect URL.

If an invoice already has a Stripe Checkout Session, web requests may reuse it
as before. Mobile requests reuse it only when Stripe's retrieved `success_url`
is the Clientflow payment-success path with `return_to=mobile` and matching
project and invoice IDs. An old web-only session, or a session without a
verifiable mobile success URL, gets a new mobile Checkout Session instead.

## Package management contracts

`GET /api/packages` remains public and returns active packages ordered by
`sortOrder`. Staff can create packages with `POST /api/packages`:

```json
{
  "name": "Full Website",
  "slug": "full-website",
  "description": "A complete multi-page marketing site.",
  "price": 6500,
  "currency": "usd",
  "estimatedDuration": "6–8 weeks",
  "sortOrder": 2
}
```

Prices use major currency units, matching the public GET response, and are
stored to two decimal places. A successful create returns 201 with the same
package shape as GET. Duplicate slugs return 409. `PATCH /api/packages/:id`
accepts any subset of the editable fields, including `isActive: false` for
deactivation; packages are never deleted. Duplicate slugs return 409 and a
missing package returns 404. Updating a package only updates that package row:
existing projects and invoices retain their historical values and are not
retroactively repriced.

`GET /api/auth/me` requires a valid session and returns the signed-in user's
`id`, `name`, `email`, and `role`. Client sessions also receive `clientId`, the
linked `Client` record ID; staff responses omit that field. An invalid or
missing session returns 401 with an empty response body.

`POST /api/clients/:id/resend-invitation` is staff-only. It looks up the known
client by Client ID, issues a fresh verification code through the same
verification-email helper used after request approval, and returns
`{ "emailSent": true }`. If Resend fails, the route returns 200 with
`{ "emailSent": false }` so the caller can distinguish a database/client lookup
success from email delivery. Unknown clients return 404 and client sessions
return 403.

`GET /api/staff` is staff-only and returns all staff users ordered newest first.
Each item contains only `id`, `email`, `name`, `role`, `isActive`, and the ISO
serialized `createdAt`; password, verification-code, reset-token, and invitation
fields are never returned. `POST /api/staff/invite` accepts `{ "email": string,
"name": string }`, rejects any existing user email with 409, creates an inactive
`STAFF` user, and sends a verification-code invitation through the same helper.
The uniqueness check is advisory; if a concurrent invite wins the database's
unique-email race, that `P2002` result is also converted to 409. It returns 201
with `{ "user": User, "emailSent": boolean }`; an email failure does not undo
the user creation. Staff invitation and resend emails include an
`/accept-invite?email=...` URL. Its origin comes from `APP_URL` when configured,
otherwise from the request origin, so no production domain is hardcoded. Client
verification emails do not include that staff-only URL. All verification codes,
including staff invitations, expire in 30 minutes. `POST
/api/staff/:id/resend-invitation` looks up the ID directly as a `STAFF` user and
has the same `{ "emailSent": boolean }` response and 401/403/404 behavior as the
client resend route.

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

When the current project status is `PENDING`, the route returns 409 for every
manual phase change until the project's initial `DEPOSIT` invoice is exactly
`PAID`; a missing, pending, failed, voided, or refunded deposit is not a
confirmed payment. The route also rejects manual `PENDING → DISCOVERY` even
after payment, because that transition belongs to the verified Stripe webhook.
Custom projects use an initial `CUSTOM` invoice rather than a deposit, so their
existing manual non-Discovery behavior is preserved; `CUSTOM` invoices do not
trigger the standard deposit gate or the webhook's automatic Discovery change.

## Client onboarding contracts

`POST /api/requests` is public and accepts a prospect's name, email, active
`packageId`, and optional `companyName` and `message`:

```json
{
  "name": "Alex Morgan",
  "email": "alex@example.com",
  "packageId": "pkg-full-website",
  "companyName": "Alex Studio",
  "message": "Build us a new site."
}
```

It validates the package before creating a `PENDING` request and never creates
a user, client, project, or other account data. Unknown or inactive packages
return 400. A successful request returns 201 with the same flat request shape
used by `GET /api/requests`.

`PATCH /api/requests/:id` is staff-only and accepts `{ "status": "APPROVED" }`
or `{ "status": "REJECTED" }`. Authentication and authorization errors are
returned before body validation; invalid bodies return 400, missing requests
404, and already-reviewed requests 409. Approval atomically creates the client
user and client record when they do not already exist, links an existing user
or client by email when present, and marks the request approved. Rejection only
marks the request rejected and creates no user, client, or project.

Approval also atomically creates the first project and deposit invoice for a
standard-package request. The project name is `<company name or prospect name>
— <package name>` and its initial status is `PENDING`, which is the exact status
the Stripe webhook uses to unlock the next project stage. The invoice is a
`DEPOSIT` for half the package price, rounded to two decimal places, uses the
package currency, and is created through the `DRAFT` → `SENT` invoice
transition with an issue date so the client can pay immediately. The remaining
half is deliberately left for a later staff-created final invoice. Requests
without a package are rejected explicitly rather than producing a zero-value
invoice.

After an approval transaction commits, the verification code is generated and
the email is sent in a separate operation. The approval remains successful if
Resend fails; the response then contains `emailSent: false`, and the failure is
logged so staff can resend through the verification endpoint. A successful
approval returns `{ request, emailSent: true }`.

`POST /api/auth/verification/verify` checks `{ "email": string, "code":
string }` and returns `{ "verified": true, "user": ... }` without changing
the account or consuming the code. Verification codes remain valid for 30
minutes. `POST /api/auth/set-password` re-checks and consumes the same code
while setting the password, activating the account, and creating the session.

`POST /api/auth/set-password` accepts `{ "email": string, "code": string,
"password": string }`. Passwords must be at least eight characters. The server
looks up the stored, unexpired code and verifies it again before hashing the
password, activating the user, clearing the code, and returning the same
`{ user, token }` session shape as login. Invalid or expired codes always return
the generic `Invalid or expired verification code` error.

`POST /api/auth/verification/send` still returns `{ "sent": true }` for unknown
emails. That generic response is intentional and remains the account-
enumeration protection for the endpoint.

`POST /api/contact-leads` is public and accepts `{ "name": string, "email":
string, "message": string }`. It creates a `ContactLead` and notifies every
staff user with a `REQUEST_SUBMITTED` in-app notification. It returns 201 with
the lead's `id`, name, email, message, and ISO `createdAt`; invalid JSON, names
over 120 characters, messages over 2,000 characters, and invalid emails return
400.

`GET /api/contact-leads` is staff-only and returns the leads newest first. When a
lead email matches a `Client`, the response includes that client's `clientId`
so the dashboard can show it as converted. The dashboard's conversion action
calls `POST /api/contact-leads/:id/convert` with `{ "projectName": string,
"companyName"?: string, "description"?: string, "amount": number | string,
"currency": string, "invoiceDescription"?: string, "dueDate"?: string,
"sendInvoice"?: boolean }`. The route runs the client lookup/creation,
package-less `PENDING` project, and `CUSTOM` invoice in one transaction. The
invoice is `DRAFT` unless `sendInvoice` is true, in which case it follows the
normal `DRAFT` → `SENT` transition and creates an `INVOICE_ISSUED`
notification. New or inactive clients receive a verification-code invitation
after the transaction commits; an email failure does not roll back the
created records and is returned as `emailSent: false`. Staff-email conflicts
and concurrent client creation races return 409.

## Notification side effects

The following user-facing events create in-app notifications in the same
transaction as their database change:

| Event | Recipient | Type |
|-------|-----------|------|
| A project request is submitted | Every staff user | `REQUEST_SUBMITTED` |
| A request is approved | The newly onboarded client | `REQUEST_APPROVED` |
| A request is rejected | An already-linked client, if one exists | `REQUEST_REJECTED` |
| An invoice moves to `SENT` | The invoice's client | `INVOICE_ISSUED` |
| A project status changes | The project's client | `PROJECT_STAGE_CHANGED` |

Rejection normally happens before a prospect has an account, so the route does
not create a user just to deliver an in-app notification. An existing linked
client is notified when that relationship is present. Payment success and
failure notifications remain owned by the Stripe webhook; new-note and
extra-charge notifications belong to the write endpoints that will create
those records.
