# SPEC.md

The feature-level source of truth. `AGENTS.md` says *how* to work; this says *what* to build. Every task an agent picks up should trace back to a line here.

App: Clientflow (working name) — a client and project management CRM for a small web design/development studio. Web = public marketing site + staff dashboard. Mobile (React Native/Expo) = the entire client-facing experience. See `AGENTS.md` for the full context, stack, and design direction.

## Features (v1 / must-have)

| # | Feature | Definition of done | Status |
|---|---------|--------------------|--------|
| 1 | Public landing page | Hero, the three service packages (Landing Page, Full Website, Web App Build) with pricing pulled from the `Package` table, a project-request form for the two fixed-price packages, a contact form for the custom package, prompts to download the mobile app. Matches the design direction in AGENTS.md — richer/more colorful than the dashboard, still restrained. | not started |
| 2 | Staff auth | Register (bootstraps the first staff account), invite-a-teammate flow from Settings, login, forgot-password, email verification via a code (sent through Resend). Works end to end, including the error states (wrong code, expired code, already-registered email). | not started |
| 3 | Client auth (mobile) | The same underlying auth system, used by clients: account is created/activated on request-approval or by staff for custom work, client sets a password via an emailed verification code, logs in, forgot-password works. Never a self-registration entry point for clients. | not started |
| 4 | Project request → approval flow | Prospect submits a request for a standard package, lands in a `Pending` queue. Staff reviews and approves or rejects from the dashboard. Approval creates/activates the `Client` and sends the app-invitation email. Rejection notifies the prospect and creates nothing further. | not started |
| 5 | Custom package flow | Prospect submits the contact form. Staff manually creates the `Client`, `Project`, and a custom `Invoice` after their own conversation with the prospect (outside the app). | not started |
| 6 | Staff dashboard — Projects, Clients, Invoices tables | Three tables with search and filtering, status badges, an overdue-payment indicator on invoices. Density and composition follow the design direction (hairline row separators, no default pill-badge-on-everything). | not started |
| 7 | Table actions | Approve/reject a request, change a project's status (any direction, staff-driven, except the payment-gated Approved→Discovery transition), create/send an invoice, void an invoice, resend a client's app invitation. Confirmation dialog before anything destructive (reject, void, cancel). **An invoice can never be marked paid manually** — `prisma/invoice-state.ts` makes `PAID` reachable only from `PAYMENT_PENDING`, which the Stripe webhook owns. That is a deliberate integrity rule. | send/void invoice + project status done 11 Aug; request approve/reject and resend invitation still to do |
| 8 | Project detail page | One page, rendered differently by role. Staff view: full control — status, invoice list and creation, the shared note feed, client info. Client view (mobile): stage tracker, shared notes, invoice list, Pay button. Every status change writes a system-generated entry to the shared note feed (this is the audit trail). | not started |
| 9 | Shared note feed / lightweight change requests | One immutable, shared activity feed per project. Either side can post a text note (no attachments, no editing/deleting). This is also how a client requests a mid-project change — staff sees it and, if it costs more, raises an extra invoice through the normal invoice flow. No separate approval workflow. | not started |
| 10 | Stripe purchasing flow | Client pays a deposit (standard flow, after approval) or a custom invoice (custom flow) through Stripe Checkout (sandbox). Invoice status follows `Draft → Sent → Payment Pending → Paid / Failed / Voided / Refunded`. A project only advances on a confirmed, signature-verified Stripe webhook — never on the client clicking "Pay" alone. Tested with both a successful test card (`4242 4242 4242 4242`) and a declined one, not just the happy path. Webhook handler built and tested locally via the Stripe CLI (`stripe listen` / `stripe trigger`), and confirmed idempotent — the same event delivered twice (Stripe retries by design) must not double-process, double-notify, or error. Voiding an invoice that's already `Paid` is blocked outright. | not started |
| 11 | Analytics | Revenue over time, revenue by package, project turnaround time, outstanding invoices total — real charts against real (seeded, then live) data, not static mockups. | not started |
| 12 | Settings | Manage packages and pricing (feeds both the public pricing page and internal project creation), invite staff, business profile. | not started |
| 13 | Notifications | In-app (staff) and push (mobile client) for: request submitted, request approved/rejected, invoice issued, payment succeeded/failed, project stage changed, new note, extra charge created. | not started |
| 14 | Mobile app (client experience) | Full client journey in Expo: auth, request status, project stage tracker, notes, invoices, pay, push notifications. This is a must-have, not a stretch goal. | not started |
| 15 | Seed data | A Prisma seed script populating realistic mock clients, projects spread across different stages, invoices in different states (paid/due/overdue), and at least one pending request — so the dashboard and analytics are never empty on first login. | not started |

## Edge cases to test (not just the happy path)

These came up during planning as the failure modes most likely to look fine in a demo and be quietly broken underneath. Each ties to a feature above — don't mark that feature done until its edge case is actually verified, not assumed.

- **Client data isolation (ties to #8, #14).** Client A must not be able to see or reach Client B's project — through the mobile app or a direct API call, including with a guessed or stale ID/token. This is the one most likely to look fine in every demo (you only ever log in as one client at a time) while being broken underneath. Needs an explicit test, not just trust in the query filters.
- **Wrong or expired verification code (ties to #2, #3).** Both need a real, clear error state — not a silent failure or a crash. Given email-verification auth is new territory for you specifically, test this path deliberately.
- **Staff rejects a request (ties to #4).** Confirm no orphaned `Client` or `Project` record gets created, the prospect is actually notified, and the request simply sits as `Rejected` with nothing else happening.
- **A client with more than one project (ties to #8, #14).** The data model allows it (a client returns later for a second package), but most of the flows and the mockups assumed one active project at a time. Confirm the mobile app correctly shows a list when there's more than one, not just the single-project view.
- **Stripe webhook delivered twice, and a declined payment** — see the testing note in #10's definition of done above.

## Features (v2 / nice-to-have, attempt only once every row above is solid, in this order)

1. Dark/light theme.
2. SEO metadata and sitemap.
3. AI analytics insight — a short, plain-English summary generated from already-computed dashboard numbers (read-only text, not a natural-language query feature).
4. Multi-language support (next-intl).

## User flows

**Flow A — standard package (Landing Page or Full Website).** Visitor browses the landing page, picks a package, submits a short project-request form. They get an account in `Pending` state — not yet active. Staff sees the request in the dashboard, reviews it, and approves or rejects it. On approval, the client's account activates and an app-invitation email goes out. Client downloads the mobile app, verifies their email with the code, logs in, sees the approved request, and pays the deposit through Stripe. Once the webhook confirms payment, the project moves to `Discovery` and appears in the staff Projects table.

**Flow B — custom package (Web App Build).** Visitor submits the contact form instead. Staff has an actual conversation with them outside the app, then manually creates the `Client`, the `Project`, and a custom `Invoice` directly in the dashboard. The client is invited to the mobile app the same way as Flow A — verification code, login, pays the deposit there.

**Flow C — running a project day to day.** Staff opens a project from the table and advances its status through the stages (`Discovery → Design → Development → Review → Launched`) as work actually happens — every transition after the initial payment-gated one is a manual staff action, and can move in either direction. Staff can post notes the client sees. If the client wants a mid-project change, they post a note from the mobile app; staff sees it and, if it costs more, raises an extra invoice through the same invoice flow — no separate approval system. Near completion, staff raises the final invoice; the client pays from the app; staff marks the project `Launched`. Every status change along the way writes a system note to the shared feed automatically.

## Explicitly out of scope

- **Formal change-request/re-pricing approval workflow.** A client requesting a change is handled through the shared note feed plus a normal extra invoice if it costs more — not a separate request/approve/re-price/re-approve system.
- **Refund automation.** If money needs to go back to a client, that's handled manually in Stripe's own dashboard, not built into this app.
- **Multiple staff permission tiers.** Every staff account has the same permissions. No admin/PM/designer/finance role hierarchy.
- **Multi-tenant support.** This is a single studio's app, not a SaaS other agencies sign up for. No organization-level data isolation.
- **Real-time messaging.** The shared note feed covers client-staff communication; no chat, no live typing indicators.
- **File upload/storage.** Considered during planning and deliberately cut — it wasn't in the mentor's actual requirement list, and it adds a storage dependency for a feature nobody asked for. The note feed carries written updates instead.
- **Recurring/subscription billing.** Every invoice is a one-off tied to a specific project. No recurring charges.
- **A formal "more information requested" state on a project request.** That conversation happens outside the app, the same way the custom-package conversation does; staff just approves or rejects once it's resolved.
- **Auto-expiring an approved-but-unpaid request.** It stays visible for staff to follow up on manually — no background job expiring it.
- **Data export and account deletion flows.** A legitimate concern for a real product, but wasn't in the mentor's brief and isn't warranted for a 4-day evaluation build.
- **"Mark note resolved."** A reasonable future feature, deferred past this deadline.
- **Note editing or deletion.** Notes are immutable once posted — this keeps the activity trail (and audit log of status changes) trustworthy.
